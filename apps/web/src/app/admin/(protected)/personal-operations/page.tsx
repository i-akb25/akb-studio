import { requireAdmin } from "@/features/admin/server/admin-auth";
import { verifyAuditEntries } from "@/features/admin/server/audit-integrity";
import {
  boundedRetentionDays,
  retentionCutoff,
} from "@/features/operations/retention-policy";
import { prisma } from "@/server/db/prisma";

export default async function PersonalOperationsPage() {
  await requireAdmin("audit:read");
  const now = new Date();
  const auditRetentionDays = boundedRetentionDays(
    process.env.AUDIT_RETENTION_DAYS,
    365,
    30,
    3_650,
  );
  const contactRetentionDays = boundedRetentionDays(
    process.env.CONTACT_RETENTION_DAYS,
    180,
    1,
    365,
  );
  const auditCutoff = retentionCutoff(now, auditRetentionDays);
  const analyticsCutoff = retentionCutoff(now, 30);
  const [
    contacts,
    privacyRequests,
    conversations,
    gapSamples,
    journeys,
    sessions,
    verifications,
    rateLimits,
    analytics,
    auditEvents,
    auditAnchor,
    chain,
    pendingSuggestions,
    reviewedSuggestions,
    recovery,
  ] = await Promise.all([
    prisma.contactSubmission.count({
      where: { retentionUntil: { lte: now } },
    }),
    prisma.privacyRequest.count({
      where: { retentionUntil: { lte: now } },
    }),
    prisma.aevaConversation.count({
      where: { retentionUntil: { lte: now } },
    }),
    prisma.aevaKnowledgeGap.count({
      where: {
        sampleRetentionUntil: { lte: now },
        encryptedQuestion: { not: null },
      },
    }),
    prisma.anonymousJourney.count({
      where: { retentionUntil: { lte: now } },
    }),
    prisma.session.count({ where: { expiresAt: { lte: now } } }),
    prisma.verification.count({ where: { expiresAt: { lte: now } } }),
    prisma.securityRateLimit.count({ where: { expiresAt: { lte: now } } }),
    prisma.analyticsMetric.count({
      where: { capturedOn: { lt: analyticsCutoff } },
    }),
    prisma.auditLog.count({ where: { createdAt: { lte: auditCutoff } } }),
    prisma.auditLog.findFirst({
      where: { createdAt: { lte: auditCutoff }, entryHash: { not: null } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    }),
    prisma.auditLog.findMany({
      where: { entryHash: { not: null } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.studioSuggestion.count({ where: { state: "PENDING" } }),
    prisma.studioSuggestion.count({
      where: { state: { in: ["APPROVED", "REJECTED"] } },
    }),
    prisma.recoveryVerification.findFirst({
      orderBy: { restoreTestedAt: "desc" },
    }),
  ]);
  const integrity = verifyAuditEntries(chain);
  const retentionItems = [
    ["Contact submissions", contacts],
    ["Privacy requests", privacyRequests],
    ["Shared Aeva conversations", conversations],
    ["Aeva question samples", gapSamples],
    ["Anonymous journeys", journeys],
    ["Expired sessions", sessions],
    ["Expired verification records", verifications],
    ["Expired rate-limit buckets", rateLimits],
    ["Analytics metrics over 30 days", analytics],
    [
      "Rotatable audit events",
      Math.max(0, auditEvents - Number(Boolean(auditAnchor))),
    ],
  ] as const;
  const overdue = retentionItems.reduce((sum, [, count]) => sum + count, 0);

  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Personal operations</p>
        <h1>Retention, approvals and recovery</h1>
        <p>
          Owner-only controls for reviewing operational state. This page never
          deletes data or applies a suggestion automatically.
        </p>
      </header>

      <section aria-labelledby="retention-heading">
        <h2 id="retention-heading">Retention review</h2>
        <p>
          {overdue} record(s) are eligible for cleanup. New contact records use
          a {contactRetentionDays}-day retention period; audit records rotate
          after {auditRetentionDays} days while retaining one chain checkpoint.
        </p>
        <dl className="akb-ops-metrics">
          {retentionItems.map(([label, count]) => (
            <div className="akb-ops-metric" key={label}>
              <dt>{label}</dt>
              <dd>{count}</dd>
            </div>
          ))}
        </dl>
        <div className="akb-admin-guide">
          <strong>Dry run before deletion</strong>
          <p>
            Run <code>pnpm --filter @akb-studio/web retention:cleanup</code>,
            inspect every category, then add <code>-- --execute</code> only
            after the report is correct. Contact and privacy records are kept if
            their Gmail disposition fails.
          </p>
        </div>
      </section>

      <section aria-labelledby="integrity-heading">
        <h2 id="integrity-heading">Audit integrity</h2>
        <p>
          {integrity.valid
            ? `${integrity.count} retained chained event(s) verified${integrity.checkpointed ? " from a rotation checkpoint" : ""}.`
            : `Verification failed at ${integrity.errorId ?? "an unknown event"}. Stop administrative writes and investigate.`}
        </p>
      </section>

      <section aria-labelledby="approval-heading">
        <h2 id="approval-heading">Approval state</h2>
        <p>
          {pendingSuggestions} suggestion(s) await an owner decision;{" "}
          {reviewedSuggestions} decision(s) are recorded. Approval records a
          decision only. It does not modify public content.
        </p>
      </section>

      <section aria-labelledby="recovery-heading">
        <h2 id="recovery-heading">Recovery verification</h2>
        {recovery ? (
          <p>
            Latest drill: {recovery.outcome} · {recovery.backupLabel} ·{" "}
            {recovery.restoreTestedAt.toISOString()}
          </p>
        ) : (
          <p>
            No restore drill is recorded. A backup is not verified until a
            restore test has been performed and recorded.
          </p>
        )}
      </section>
    </main>
  );
}
