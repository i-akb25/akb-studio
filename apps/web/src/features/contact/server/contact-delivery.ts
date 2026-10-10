import "server-only";

import type { ContactSubmission } from "@/features/contact/server/contact-schema";
import { recordOperationalHealth } from "@/server/analytics/metrics";
import { prisma } from "@/server/db/prisma";
import { sendContactEmail } from "@/server/email/gmail-contact";

const DEFAULT_DAILY_LIMIT = 100;
const MAX_ATTEMPTS = 3;

function dailyLimit(): number {
  const configured = Number(
    process.env.CONTACT_EMAIL_DAILY_LIMIT ?? DEFAULT_DAILY_LIMIT,
  );
  return Number.isFinite(configured) && configured > 0
    ? Math.max(1, Math.min(Math.floor(configured), DEFAULT_DAILY_LIMIT))
    : DEFAULT_DAILY_LIMIT;
}

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function deliverContactNotification(input: {
  submissionId: string;
  reference: string;
  submission: ContactSubmission;
}): Promise<"sent" | "failed"> {
  if (process.env.CONTACT_EMAIL_ENABLED !== "true") {
    await prisma.contactSubmission.update({
      where: { id: input.submissionId },
      data: { deliveryStatus: "FAILED", deliveryLastError: "gmail_disabled" },
    });
    await recordOperationalHealth({
      key: "gmail_contact",
      status: "disabled",
      summary: "Contact email delivery is disabled",
    });
    return "failed";
  }

  const notificationsToday = await prisma.contactSubmission.count({
    where: { createdAt: { gte: startOfUtcDay() } },
  });
  if (notificationsToday > dailyLimit()) {
    await prisma.contactSubmission.update({
      where: { id: input.submissionId },
      data: {
        deliveryStatus: "FAILED",
        deliveryLastError: "daily_safety_limit",
      },
    });
    await recordOperationalHealth({
      key: "gmail_contact",
      status: "critical",
      summary: "Daily email safety limit reached",
    });
    return "failed";
  }

  let lastError = "gmail_request_failed";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const attemptedAt = new Date();
    const result = await sendContactEmail(input.submission, input.reference);
    if (result.ok) {
      await prisma.contactSubmission.update({
        where: { id: input.submissionId },
        data: {
          deliveryStatus: "SENT",
          gmailMessageId: result.messageId,
          deliveryAttemptCount: attempt,
          deliveryLastError: null,
          deliveryLastAttemptAt: attemptedAt,
          deliveredAt: new Date(),
        },
      });
      await recordOperationalHealth({
        key: "gmail_contact",
        status: "healthy",
        summary: "Contact notification delivered",
      });
      return "sent";
    }

    lastError = result.error;
    await prisma.contactSubmission.update({
      where: { id: input.submissionId },
      data: {
        deliveryStatus: "FAILED",
        deliveryAttemptCount: attempt,
        deliveryLastError: lastError,
        deliveryLastAttemptAt: attemptedAt,
      },
    });
    if (attempt < MAX_ATTEMPTS) await wait(250 * 2 ** (attempt - 1));
  }

  await recordOperationalHealth({
    key: "gmail_contact",
    status: "degraded",
    summary: lastError,
  });
  return "failed";
}
