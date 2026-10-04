import Link from "next/link";
import { prisma } from "@/server/db/prisma";

async function countOrNull(query: Promise<number>) {
  try {
    return await query;
  } catch {
    return null;
  }
}

const tasks = [
  [
    "Update project",
    "/admin/projects",
    "Edit project details, cover, links or publication state.",
  ],
  [
    "Publish writing",
    "/admin/content",
    "Create Journal or Knowledge content and preview it before publishing.",
  ],
  [
    "Upload media",
    "/admin/media",
    "Add images, documents, video or audio and receive an asset ID.",
  ],
  [
    "Change music",
    "/admin/media#audio",
    "Choose an uploaded audio asset and control the public music button.",
  ],
  [
    "Review requests",
    "/admin/requests",
    "Read contact and privacy requests without mixing them with public content.",
  ],
  [
    "Check system",
    "/admin/analytics",
    "Review consented analytics, delivery failures and provider health.",
  ],
] as const;

export default async function AdminDashboardPage() {
  const [projects, media, submissions, drafts, audit] = await Promise.all([
    countOrNull(prisma.project.count()),
    countOrNull(prisma.mediaAsset.count({ where: { state: "READY" } })),
    countOrNull(
      prisma.contactSubmission.count({
        where: { state: { in: ["NEW", "IN_REVIEW", "WAITING"] } },
      }),
    ),
    countOrNull(prisma.editorialDocument.count({ where: { state: "DRAFT" } })),
    prisma.auditLog
      .findMany({ orderBy: { createdAt: "desc" }, take: 6 })
      .catch(() => []),
  ]);
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Private Studio</p>
        <h1>Good to see you.</h1>
        <p>
          Choose the exact job you want to perform. Public pages are changed
          only after a successful save or publication.
        </p>
      </header>
      <dl aria-label="Portfolio status">
        <div>
          <dt>Projects</dt>
          <dd>{projects ?? "—"}</dd>
        </div>
        <div>
          <dt>Ready media</dt>
          <dd>{media ?? "—"}</dd>
        </div>
        <div>
          <dt>Open contacts</dt>
          <dd>{submissions ?? "—"}</dd>
        </div>
        <div>
          <dt>Editorial drafts</dt>
          <dd>{drafts ?? "—"}</dd>
        </div>
      </dl>
      <div className="akb-admin-card-grid">
        {tasks.map(([title, href, description], index) => (
          <Link className="akb-admin-task-card" href={href} key={href}>
            <span>Task {String(index + 1).padStart(2, "0")}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2>Recent recorded changes</h2>
        {audit.length ? (
          <div className="akb-admin-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td>{entry.action}</td>
                    <td>
                      {entry.entityType}
                      {entry.entityId ? ` / ${entry.entityId}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="akb-admin-guide">
            <strong>No recorded Admin changes</strong>
            <p>
              The audit log begins when a supported Admin save, upload,
              publication or moderation mutation succeeds. It is not a visitor
              activity log.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
