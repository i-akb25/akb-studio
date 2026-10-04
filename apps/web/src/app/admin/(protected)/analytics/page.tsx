import { requireAdmin } from "@/features/admin/server/admin-auth";
import {
  failureAlert,
  freshnessAlert,
} from "@/features/analytics/server/thresholds";
import { prisma } from "@/server/db/prisma";

export default async function AnalyticsPage() {
  await requireAdmin("analytics:read");
  const now = new Date();
  const since24Hours = new Date(now.getTime() - 24 * 3_600_000);
  const since30Days = new Date(now.getTime() - 30 * 86_400_000);
  const [metrics, services, aevaFailures, contactFailures, restore] =
    await Promise.all([
      prisma.analyticsMetric.findMany({
        where: { capturedOn: { gte: since30Days } },
        orderBy: [{ capturedOn: "desc" }, { count: "desc" }],
        take: 500,
      }),
      prisma.operationalHealth.findMany({ orderBy: { key: "asc" } }),
      prisma.aevaIncident.aggregate({
        where: { resolvedAt: null, lastSeenAt: { gte: since24Hours } },
        _sum: { occurrences: true },
      }),
      prisma.contactSubmission.count({
        where: { deliveryStatus: "FAILED", createdAt: { gte: since24Hours } },
      }),
      prisma.recoveryVerification.findFirst({
        where: { outcome: "PASS" },
        orderBy: { restoreTestedAt: "desc" },
      }),
    ]);
  const totals = new Map<string, number>();
  for (const metric of metrics)
    totals.set(metric.kind, (totals.get(metric.kind) ?? 0) + metric.count);
  const scheduled = services.find(
    (item) => item.key === "scheduled_publishing",
  );
  const alerts = [
    failureAlert({
      id: "aeva",
      label: "Aeva failures",
      count: aevaFailures._sum.occurrences ?? 0,
      warningAt: 5,
      criticalAt: 20,
    }),
    failureAlert({
      id: "contact",
      label: "Contact delivery failures",
      count: contactFailures,
      warningAt: 3,
      criticalAt: 10,
    }),
    freshnessAlert({
      id: "publishing",
      label: "Scheduled publishing",
      observedAt: scheduled?.lastSuccessAt,
      warningAfterHours: 0.5,
      criticalAfterHours: 2,
      now,
    }),
    freshnessAlert({
      id: "backup",
      label: "Restore verification",
      observedAt: restore?.restoreTestedAt,
      warningAfterHours: 168,
      criticalAfterHours: 720,
      now,
    }),
  ];
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Analytics / reliability</p>
        <h1>Operational dashboard</h1>
        <p>
          Consent-gated engagement totals and content-free service health. No
          prompt text, contact identity, raw IP address, or user agent is stored
          here.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>Why visitor totals can be empty</strong>
        <p>
          Only consented, aggregate events are stored. An empty report means no
          eligible events were recorded in this period; it is not silently
          replaced with guessed traffic.
        </p>
      </div>
      <section aria-labelledby="alerts-heading">
        <h2 id="alerts-heading">Alert thresholds</h2>
        <div className="akb-ops-grid">
          {alerts.map((alert) => (
            <article key={alert.id} data-level={alert.level}>
              <span>{alert.level}</span>
              <h3>{alert.label}</h3>
              <p>{alert.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="conversions-heading">
        <h2 id="conversions-heading">Last 30 days</h2>
        {totals.size ? (
          <dl className="akb-ops-metrics">
            {[...totals.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([kind, count]) => (
                <div className="akb-ops-metric" key={kind}>
                  <dt>{kind.replaceAll("_", " ")}</dt>
                  <dd>{count}</dd>
                </div>
              ))}
          </dl>
        ) : (
          <p>No consented conversion events have been recorded.</p>
        )}
      </section>
      <section aria-labelledby="services-heading">
        <h2 id="services-heading">Service health</h2>
        {services.length ? (
          <div className="akb-ops-table">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Status</th>
                  <th>Checked</th>
                  <th>Failures</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.key}>
                    <th>{service.key.replaceAll("_", " ")}</th>
                    <td>{service.status}</td>
                    <td>{service.lastCheckedAt.toISOString()}</td>
                    <td>{service.consecutiveFailures}</td>
                    <td>
                      {service.latencyMs === null
                        ? "—"
                        : `${service.latencyMs} ms`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No health probes have reported yet.</p>
        )}
      </section>
      <section aria-labelledby="backup-heading">
        <h2 id="backup-heading">Backup verification</h2>
        {restore ? (
          <p>
            Latest successful restore drill:{" "}
            {restore.restoreTestedAt.toISOString()} · {restore.backupLabel}
          </p>
        ) : (
          <p>
            No successful restore drill has been recorded. A backup is not
            verified until a restore test passes.
          </p>
        )}
      </section>
    </main>
  );
}
