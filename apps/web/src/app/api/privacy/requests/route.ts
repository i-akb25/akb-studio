import { randomBytes } from "node:crypto";

import {
  hasValidContactOrigin,
  submissionTimingIsValid,
} from "@/features/contact/server/contact-guard";
import { acceptPrivacyRequest } from "@/features/legal/server/privacy-request-guard";
import { privacyRequestSchema } from "@/features/legal/server/privacy-request-schema";
import { prisma } from "@/server/db/prisma";
import { sendPrivacyRequestEmail } from "@/server/email/gmail-contact";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const MAX_BODY_BYTES = 12_000;

function referenceId(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `PRIV-${date}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  if (!hasValidContactOrigin(request))
    return Response.json(
      { ok: false, message: "Invalid request." },
      { status: 403 },
    );
  let candidate: unknown;
  try {
    candidate = await readJsonBody(request, MAX_BODY_BYTES);
  } catch (error) {
    return Response.json(
      { ok: false, message: "Invalid request." },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }
  if (
    candidate &&
    typeof candidate === "object" &&
    "website" in candidate &&
    String((candidate as { website?: unknown }).website ?? "").trim()
  )
    return Response.json({ ok: true, message: "Request received." });

  const parsed = privacyRequestSchema.safeParse(candidate);
  if (!parsed.success || !submissionTimingIsValid(parsed.data.startedAt))
    return Response.json(
      { ok: false, message: "Check the supplied information and try again." },
      { status: 400 },
    );
  if (!(await acceptPrivacyRequest(request, parsed.data.email)))
    return Response.json(
      { ok: false, message: "Too many requests. Wait before trying again." },
      { status: 429, headers: { "Retry-After": "900" } },
    );

  const reference = referenceId();
  const now = Date.now();
  let privacyRequest: { id: string };
  try {
    privacyRequest = await prisma.privacyRequest.create({
      data: {
        reference,
        name: parsed.data.name,
        email: parsed.data.email,
        type: parsed.data.type,
        details: parsed.data.details,
        relatedReference: parsed.data.relatedReference,
        resourceUrl: parsed.data.resourceUrl,
        policyVersion: parsed.data.policyVersion,
        responseDueAt: new Date(now + 30 * 86_400_000),
        retentionUntil: new Date(now + 395 * 86_400_000),
      },
      select: { id: true },
    });
  } catch {
    return Response.json(
      { ok: false, message: "The privacy request channel is unavailable." },
      { status: 503 },
    );
  }

  const delivery = await sendPrivacyRequestEmail({
    reference,
    name: parsed.data.name,
    email: parsed.data.email,
    type: parsed.data.type,
    details: parsed.data.details,
    relatedReference: parsed.data.relatedReference,
    resourceUrl: parsed.data.resourceUrl,
    policyVersion: parsed.data.policyVersion,
  });
  await prisma.privacyRequest.update({
    where: { id: privacyRequest.id },
    data: delivery.ok
      ? {
          deliveryStatus: "SENT",
          gmailMessageId: delivery.messageId,
          deliveredAt: new Date(),
          deliveryLastAttemptAt: new Date(),
          deliveryAttemptCount: { increment: 1 },
        }
      : {
          deliveryStatus: "FAILED",
          deliveryLastError: delivery.error,
          deliveryLastAttemptAt: new Date(),
          deliveryAttemptCount: { increment: 1 },
        },
  });

  return Response.json(
    {
      ok: true,
      reference,
      message:
        "Keep this reference. AKB Studio may ask you to verify control of the relevant email before disclosure or deletion.",
    },
    { status: 201 },
  );
}
