import { createHash } from "node:crypto";
import { z } from "zod";
import { recordAuditInTransaction } from "@/features/admin/server/audit";
import { deliverContactNotification } from "@/features/contact/server/contact-delivery";
import { hasValidContactOrigin } from "@/features/contact/server/contact-guard";
import { contactSubmissionSchema } from "@/features/contact/server/contact-schema";
import { prisma } from "@/server/db/prisma";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const schema = z
  .object({
    token: z.string().min(32).max(128),
    action: z.enum(["approve", "reject"]),
  })
  .strict();

export async function POST(request: Request) {
  if (!hasValidContactOrigin(request))
    return Response.json({ message: "Invalid request." }, { status: 403 });
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await readJsonBody(request, 1_024));
  } catch (error) {
    return Response.json(
      { message: "Invalid request." },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }

  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  const consent = await prisma.consentRecord.findFirst({
    where: {
      verificationTokenHash: tokenHash,
      consentType: "guardian_consent",
      granted: false,
      verifiedAt: null,
      verificationExpiresAt: { gt: new Date() },
      submission: { state: "PENDING_GUARDIAN" },
    },
    include: { submission: true },
  });
  if (!consent)
    return Response.json(
      { message: "This link is invalid, expired or already used." },
      { status: 410 },
    );

  if (input.action === "reject") {
    await prisma.$transaction(async (tx) => {
      await recordAuditInTransaction(tx, {
        action: "DELETE",
        entityType: "MinorContactSubmission",
        entityId: consent.submission.reference,
        after: { decision: "guardian_rejected" },
      });
      await tx.contactSubmission.delete({
        where: { id: consent.submissionId },
      });
    });
    return Response.json({
      ok: true,
      message: "The request was rejected and its contact content was deleted.",
    });
  }

  const notice = await prisma.consentRecord.findFirst({
    where: {
      submissionId: consent.submissionId,
      consentType: "notice_acknowledgement",
    },
  });
  if (!notice)
    return Response.json(
      { message: "The request is incomplete and cannot be approved." },
      { status: 409 },
    );

  const releasableSubmission = contactSubmissionSchema.safeParse({
    name: consent.submission.name,
    email: consent.submission.email,
    organisation: consent.submission.organisation ?? undefined,
    category: consent.submission.category,
    subject: consent.submission.subject,
    message: consent.submission.message,
    relevantUrl: consent.submission.relevantUrl ?? undefined,
    ageGroup: "minor",
    guardianName: consent.guardianName ?? undefined,
    guardianEmail: consent.guardianEmail ?? undefined,
    privacyAccepted: true,
    policyVersion: notice.policyVersion,
    startedAt: Date.now(),
    website: "",
    turnstileToken: undefined,
  });
  if (!releasableSubmission.success)
    return Response.json(
      { message: "The request is incomplete and cannot be approved." },
      { status: 409 },
    );

  const retentionDays = Math.max(
    1,
    Number(process.env.CONTACT_RETENTION_DAYS ?? 180),
  );
  await prisma.$transaction([
    prisma.consentRecord.update({
      where: { id: consent.id },
      data: {
        granted: true,
        verifiedAt: new Date(),
        verificationTokenHash: null,
        evidence: { method: "one_time_email_link", decision: "approved" },
      },
    }),
    prisma.contactSubmission.update({
      where: { id: consent.submissionId },
      data: {
        state: "NEW",
        retentionUntil: new Date(Date.now() + retentionDays * 86_400_000),
        statusEvents: {
          create: {
            fromState: "PENDING_GUARDIAN",
            toState: "NEW",
            note: "Guardian consent verified",
          },
        },
      },
    }),
  ]);

  try {
    await deliverContactNotification({
      submissionId: consent.submissionId,
      reference: consent.submission.reference,
      submission: releasableSubmission.data,
    });
  } catch {
    // The approved submission remains durable and delivery can be retried in Admin.
  }

  return Response.json({
    ok: true,
    message: "Consent was recorded and the enquiry was released to AKB Studio.",
  });
}
