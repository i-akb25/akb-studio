import { prisma } from "../src/server/db/prisma-client";
import { trashContactEmail } from "../src/server/email/gmail-contact";

async function main() {
  const execute = process.argv.includes("--execute");
  const now = new Date();
  const auditRetentionDays = Math.max(
    30,
    Number(process.env.AUDIT_RETENTION_DAYS ?? 365),
  );
  const auditCutoff = new Date(now.getTime() - auditRetentionDays * 86_400_000);
  const analyticsCutoff = new Date(now.getTime() - 30 * 86_400_000);
  const expired = await prisma.contactSubmission.findMany({
    where: { retentionUntil: { lte: now } },
    select: {
      id: true,
      reference: true,
      retentionUntil: true,
      gmailMessageId: true,
    },
    orderBy: { retentionUntil: "asc" },
  });
  const expiredPrivacyRequests = await prisma.privacyRequest.findMany({
    where: { retentionUntil: { lte: now } },
    select: { id: true, reference: true, gmailMessageId: true },
  });

  console.log(`${expired.length} contact submission(s) are past retention.`);
  for (const item of expired)
    console.log(`${item.reference} ${item.retentionUntil.toISOString()}`);

  if (execute && expired.length) {
    const deletable: string[] = [];
    for (const item of expired) {
      if (
        !item.gmailMessageId ||
        (await trashContactEmail(item.gmailMessageId))
      ) {
        deletable.push(item.id);
      } else {
        console.log(`${item.reference} retained: Gmail disposition failed.`);
      }
    }
    const result = await prisma.contactSubmission.deleteMany({
      where: { id: { in: deletable } },
    });
    console.log(`Deleted ${result.count} expired submission(s).`);
  } else if (expired.length) {
    console.log("Dry run only. Re-run with --execute after review.");
  }

  if (execute && expiredPrivacyRequests.length) {
    const deletable: string[] = [];
    for (const item of expiredPrivacyRequests) {
      if (
        !item.gmailMessageId ||
        (await trashContactEmail(item.gmailMessageId))
      ) {
        deletable.push(item.id);
      } else {
        console.log(`${item.reference} retained: Gmail disposition failed.`);
      }
    }
    const result = await prisma.privacyRequest.deleteMany({
      where: { id: { in: deletable } },
    });
    console.log(`Deleted ${result.count} expired privacy request(s).`);
  } else if (expiredPrivacyRequests.length) {
    console.log(
      `${expiredPrivacyRequests.length} privacy request(s) are past retention.`,
    );
  }

  if (execute) {
    const [
      sessions,
      verifications,
      rateLimits,
      audit,
      conversations,
      knowledgeGapSamples,
      analyticsMetrics,
      anonymousJourneys,
    ] = await prisma.$transaction([
      prisma.session.deleteMany({ where: { expiresAt: { lte: now } } }),
      prisma.verification.deleteMany({ where: { expiresAt: { lte: now } } }),
      prisma.securityRateLimit.deleteMany({
        where: { expiresAt: { lte: now } },
      }),
      prisma.auditLog.deleteMany({
        where: { createdAt: { lte: auditCutoff } },
      }),
      prisma.aevaConversation.deleteMany({
        where: { retentionUntil: { lte: now } },
      }),
      prisma.aevaKnowledgeGap.updateMany({
        where: {
          sampleRetentionUntil: { lte: now },
          encryptedQuestion: { not: null },
        },
        data: {
          encryptedQuestion: null,
          sampleConsented: false,
          consentVersion: null,
          sampleRetentionUntil: null,
        },
      }),
      prisma.analyticsMetric.deleteMany({
        where: { capturedOn: { lt: analyticsCutoff } },
      }),
      prisma.anonymousJourney.deleteMany({
        where: { lastSeenAt: { lt: analyticsCutoff } },
      }),
    ]);
    console.log(`Deleted ${sessions.count} expired session(s).`);
    console.log(`Deleted ${verifications.count} expired verification(s).`);
    console.log(`Deleted ${rateLimits.count} expired rate-limit bucket(s).`);
    console.log(`Rotated ${audit.count} expired audit event(s).`);
    console.log(
      `Deleted ${conversations.count} expired shared Aeva conversation(s).`,
    );
    console.log(
      `Removed ${knowledgeGapSamples.count} expired Aeva question sample(s).`,
    );
    console.log(
      `Deleted ${analyticsMetrics.count} expired analytics metric(s).`,
    );
    console.log(
      `Deleted ${anonymousJourneys.count} expired journey record(s).`,
    );
  }

  await prisma.$disconnect();
}

void main().catch(async (error) => {
  console.error(
    error instanceof Error ? error.message : "Retention cleanup failed",
  );
  await prisma.$disconnect().catch(() => {});
  process.exitCode = 1;
});
