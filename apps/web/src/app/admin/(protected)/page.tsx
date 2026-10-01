import { prisma } from "@/server/db/prisma";

export default async function AdminDashboardPage() {
  const [projects, media, submissions, drafts, audit] = await Promise.all([
    prisma.project.count(),
    prisma.mediaAsset.count({ where: { state: "READY" } }),
    prisma.contactSubmission.count({
      where: { state: { in: ["NEW", "IN_REVIEW", "WAITING"] } },
    }),
    prisma.editorialDocument.count({ where: { state: "DRAFT" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Private Studio</p>
        <h1>Operational control</h1>
        <p>
          Approved content, private requests and publication state remain
          separated.
        </p>
      </header>
      <dl>
        <div>
          <dt>Projects</dt>
          <dd>{projects}</dd>
        </div>
        <div>
          <dt>Ready media</dt>
          <dd>{media}</dd>
        </div>
        <div>
          <dt>Open contacts</dt>
          <dd>{submissions}</dd>
        </div>
        <div>
          <dt>Editorial drafts</dt>
          <dd>{drafts}</dd>
        </div>
      </dl>
      <section>
        <h2>Recent audit events</h2>
        {audit.length ? (
          <ul>
            {audit.map((entry) => (
              <li key={entry.id}>
                {entry.action} · {entry.entityType} ·{" "}
                {entry.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No operational changes recorded yet.</p>
        )}
      </section>
    </main>
  );
}
