import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { ContactResponse } from "@/features/contact/model";
import { deliverContactNotification } from "@/features/contact/server/contact-delivery";
import {
  checkContactLimits,
  hasValidContactOrigin,
  releaseContactDuplicate,
  submissionTimingIsValid,
  verifyTurnstile,
} from "@/features/contact/server/contact-guard";
import { contactSubmissionSchema } from "@/features/contact/server/contact-schema";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 16_384;

function response(
  body: ContactResponse,
  status: number,
  headers?: Record<string, string>,
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function referenceId(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `AKB-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  if (!hasValidContactOrigin(request))
    return response(
      { ok: false, code: "invalid", message: "Invalid request." },
      403,
    );
  if (
    !(request.headers.get("content-type") ?? "")
      .toLowerCase()
      .includes("application/json")
  )
    return response(
      { ok: false, code: "invalid", message: "Unsupported request format." },
      415,
    );
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES)
    return response(
      { ok: false, code: "invalid", message: "Submission is too large." },
      413,
    );

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return response(
      { ok: false, code: "invalid", message: "Invalid request." },
      400,
    );
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES)
    return response(
      { ok: false, code: "invalid", message: "Submission is too large." },
      413,
    );

  let candidate: unknown;
  try {
    candidate = JSON.parse(raw);
  } catch {
    return response(
      { ok: false, code: "invalid", message: "Invalid request." },
      400,
    );
  }
  if (
    candidate &&
    typeof candidate === "object" &&
    "website" in candidate &&
    String((candidate as { website?: unknown }).website ?? "").trim()
  )
    return response(
      { ok: true, message: "Thanks. Your message has reached me." },
      202,
    );

  const parsed = contactSubmissionSchema.safeParse(candidate);
  if (!parsed.success || !submissionTimingIsValid(parsed.data.startedAt))
    return response(
      {
        ok: false,
        code: "invalid",
        message: "Check the highlighted information and try again.",
      },
      400,
    );
  if (!(await verifyTurnstile(parsed.data.turnstileToken, request)))
    return response(
      {
        ok: false,
        code: "invalid",
        message: "Verification failed. Refresh the page and try again.",
      },
      400,
    );

  const limit = await checkContactLimits(request, parsed.data);
  if (limit.status === "rate_limited")
    return response(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many attempts. Please wait before trying again.",
      },
      429,
      { "Retry-After": "900" },
    );
  if (limit.status === "duplicate")
    return response(
      {
        ok: false,
        code: "duplicate",
        message:
          "This message was already submitted. No need to send it again.",
      },
      409,
    );

  const reference = referenceId();
  const isMinor = parsed.data.ageGroup === "minor";
  const retentionDays = Math.max(
    1,
    Number(process.env.CONTACT_RETENTION_DAYS ?? 180),
  );
  const retentionUntil = new Date(Date.now() + retentionDays * 86_400_000);
  let submissionId: string;
  try {
    const submission = await prisma.contactSubmission.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        organisation: parsed.data.organisation,
        category: parsed.data.category,
        subject: parsed.data.subject,
        message: parsed.data.message,
        relevantUrl: parsed.data.relevantUrl,
        reference,
        isMinor,
        state: "NEW",
        retentionUntil,
        consentRecords: {
          create: [
            {
              policyVersion: parsed.data.policyVersion,
              consentType: "notice_acknowledgement",
              purpose: "contact_enquiry",
              granted: parsed.data.privacyAccepted,
              evidence: { ageGroup: parsed.data.ageGroup },
            },
            ...(parsed.data.followUpAccepted
              ? [
                  {
                    policyVersion: parsed.data.policyVersion,
                    consentType: "follow_up_reminder",
                    purpose: "contact_follow_up",
                    granted: true,
                    evidence: { method: "optional_contact_checkbox" },
                  },
                ]
              : []),
            ...(isMinor && parsed.data.minorDeclaration
              ? [
                  {
                    policyVersion: parsed.data.policyVersion,
                    consentType: "minor_safety_declaration",
                    purpose: "minor_contact_safety",
                    granted: true,
                    evidence: { method: "required_form_declaration" },
                  },
                ]
              : []),
          ],
        },
        statusEvents: {
          create: {
            toState: "NEW",
            note: isMinor
              ? "Submission received with minor safety declaration"
              : "Submission received",
          },
        },
      },
    });
    submissionId = submission.id;
  } catch {
    await releaseContactDuplicate(limit.duplicateKey);
    return response(
      {
        ok: false,
        code: "unavailable",
        message:
          "The contact channel is temporarily unavailable. Please email me directly.",
      },
      503,
    );
  }

  try {
    await deliverContactNotification({
      submissionId,
      reference,
      submission: parsed.data,
    });
  } catch {
    // The canonical submission is already durable; Admin exposes delivery failures.
  }

  return response(
    {
      ok: true,
      message:
        "Thanks. Your message has reached me. I usually reply within 24–72 hours.",
      reference,
    },
    201,
  );
}
