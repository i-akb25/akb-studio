import { Prisma } from "@generated/prisma/client";
import {
  boundedRetentionDays,
  retentionCutoff,
} from "../src/features/operations/retention-policy";
import { prisma } from "../src/server/db/prisma-client";
import { trashContactEmail } from "../src/server/email/gmail-contact";

async function main() {
  const execute = process.argv.includes("--execute");
  const now = new Date();
  const auditRetentionDays = boundedRetentionDays(
    process.env.AUDIT_RETENTION_DAYS,
    365,
    30,
    3_650,
  );
  const auditCutoff = retentionCutoff(now, auditRetentionDays);
  const analyticsCutoff = retentionCutoff(now, 30);
  const [
    expired,
    expiredPrivacyRequests,
    auditAnchor,
    expiredSessions,
    expiredVerifications,
    expiredRateLimits,
    expiredAuditEvents,
    expiredConversations,
    expiredKnowledgeGapSamples,
    expiredAnalyticsMetrics,
    expiredAnonymousJourneys,
  ] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { retentionUntil: { lte: now } },
      select: {
        id: true,
        reference: true,
        retentionUntil: true,
        gmailMessageId: true,
      },
      orderBy: { retentionUntil: "asc" },
    }),
    prisma.privacyRequest.findMany({
      where: { retentionUntil: { lte: now } },
      select: { id: true, reference: true, gmailMessageId: true },
    }),
    prisma.auditLog.findFirst({
      where: { createdAt: { lte: auditCutoff }, entryHash: { not: null } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    }),
    prisma.session.count({ where: { expiresAt: { lte: now } } }),
    prisma.verification.count({ where: { expiresAt: { lte: now } } }),
    prisma.securityRateLimit.count({ where: { expiresAt: { lte: now } } }),
    prisma.auditLog.count({ where: { createdAt: { lte: auditCutoff } } }),
    prisma.aevaConversation.count({
      where: { retentionUntil: { lte: now } },
    }),
    prisma.aevaKnowledgeGap.count({
      where: {
        sampleRetentionUntil: { lte: now },
        encryptedQuestion: { not: null },
      },
    }),
    prisma.analyticsMetric.count({
      where: { capturedOn: { lt: analyticsCutoff } },
    }),
    prisma.anonymousJourney.count({
      where: { retentionUntil: { lte: now } },
    }),
  ]);

  console.log(`${expired.length} contact submission(s) are past retention.`);
  for (const item of expired)
    console.log(`${item.reference} ${item.retentionUntil.toISOString()}`);
  console.log(
    `${expiredPrivacyRequests.length} privacy request(s) are past retention.`,
  );
  console.log(`${expiredSessions} expired session(s).`);
  console.log(`${expiredVerifications} expired verification(s).`);
  console.log(`${expiredRateLimits} expired rate-limit bucket(s).`);
  console.log(
    `${Math.max(0, expiredAuditEvents - (auditAnchor ? 1 : 0))} audit event(s) can rotate; one chained checkpoint is preserved when available.`,
  );
  console.log(`${expiredConversations} expired shared Aeva conversation(s).`);
  console.log(`${expiredKnowledgeGapSamples} expired Aeva question sample(s).`);
  console.log(`${expiredAnalyticsMetrics} expired analytics metric(s).`);
  console.log(`${expiredAnonymousJourneys} expired journey record(s).`);

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
    ] = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(109545, 2202)`,
      );
      return Promise.all([
        tx.session.deleteMany({ where: { expiresAt: { lte: now } } }),
        tx.verification.deleteMany({ where: { expiresAt: { lte: now } } }),
        tx.securityRateLimit.deleteMany({
          where: { expiresAt: { lte: now } },
        }),
        tx.auditLog.deleteMany({
          where: {
            createdAt: { lte: auditCutoff },
            ...(auditAnchor ? { id: { not: auditAnchor.id } } : {}),
          },
        }),
        tx.aevaConversation.deleteMany({
          where: { retentionUntil: { lte: now } },
        }),
        tx.aevaKnowledgeGap.updateMany({
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
        tx.analyticsMetric.deleteMany({
          where: { capturedOn: { lt: analyticsCutoff } },
        }),
        tx.anonymousJourney.deleteMany({
          where: { retentionUntil: { lte: now } },
        }),
      ]);
    });
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
  } else {
    console.log("Dry run only. Re-run with --execute after review.");
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
