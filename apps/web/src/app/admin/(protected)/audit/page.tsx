import { requireAdmin } from "@/features/admin/server/admin-auth";
import { prisma } from "@/server/db/prisma";

export default async function AdminAuditPage() {
  await requireAdmin("audit:read");
  const events = await prisma.auditLog.findMany({
    include: { actor: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Accountability</p>
        <h1>Audit log</h1>
        <p>
          Administrative mutations only. Visitor browsing does not belong here
          and is never presented as an audit event.
        </p>
      </header>
      {events.length ? (
        <section>
          <h2>Latest {events.length} events</h2>
          <div className="akb-admin-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Chain</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      {event.createdAt.toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}
                    </td>
                    <td>{event.actor?.email ?? "system"}</td>
                    <td>{event.action}</td>
                    <td>
                      {event.entityType}
                      {event.entityId ? ` / ${event.entityId}` : ""}
                    </td>
                    <td>{event.entryHash ? "Recorded" : "Legacy"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="akb-admin-guide">
          <strong>No audit events yet</strong>
          <p>
            A row appears after a supported Admin upload, save, publication,
            moderation or deletion succeeds. Failed actions are logged
            operationally, but do not create a false successful audit record.
          </p>
        </div>
      )}
    </main>
  );
}
