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
      </header>
      {events.length ? (
        <ol>
          {events.map((event) => (
            <li key={event.id}>
              {event.createdAt.toISOString()} · {event.actor?.email ?? "system"}{" "}
              · {event.action} · {event.entityType}
              {event.entityId ? `/${event.entityId}` : ""}
            </li>
          ))}
        </ol>
      ) : (
        <p>No audit events yet.</p>
      )}
    </main>
  );
}
