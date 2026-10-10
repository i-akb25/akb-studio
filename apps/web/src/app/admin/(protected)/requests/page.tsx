import { requireAdmin } from "@/features/admin/server/admin-auth";
import { prisma } from "@/server/db/prisma";

export default async function AdminRequestsPage() {
  await requireAdmin("contact:moderate");
  const [submissions, privacyRequests] = await Promise.all([
    prisma.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.privacyRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Private inbox</p>
        <h1>Contact submissions</h1>
        <p>Retained until the displayed date, then eligible for deletion.</p>
      </header>
      {submissions.length ? (
        <div>
          {submissions.map((item) => (
            <article key={item.id}>
              <h2>{item.subject}</h2>
              <p>
                {item.name} · {item.email} · {item.category} · {item.state}
              </p>
              <p>{item.message}</p>
              <p>
                Reference {item.reference} · delete after{" "}
                {item.retentionUntil.toISOString().slice(0, 10)}
              </p>
              <p>
                Gmail {item.deliveryStatus.toLowerCase()} · attempts{" "}
                {item.deliveryAttemptCount}
                {item.deliveryLastError ? ` · ${item.deliveryLastError}` : ""}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p>No contact submissions yet.</p>
      )}

      <header className="akb-admin-page__header">
        <p className="akb-kicker">Privacy desk</p>
        <h2>Rights and grievance requests</h2>
        <p>Verify identity before disclosure, correction or deletion.</p>
      </header>
      {privacyRequests.length ? (
        <div>
          {privacyRequests.map((item) => (
            <article key={item.id}>
              <h3>{item.type.replaceAll("_", " ")}</h3>
              <p>
                {item.name} · {item.email} · {item.status}
              </p>
              <p>{item.details}</p>
              <p>
                Reference {item.reference} · respond by{" "}
                {item.responseDueAt.toISOString().slice(0, 10)}
              </p>
              <p>
                Gmail {item.deliveryStatus.toLowerCase()} · policy{" "}
                {item.policyVersion}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p>No privacy requests yet.</p>
      )}
    </main>
  );
}
