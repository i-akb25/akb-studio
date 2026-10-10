import { requireAdmin } from "@/features/admin/server/admin-auth";
import { releaseReadiness } from "@/features/operations/release-readiness";

export default async function ReleasePage() {
  await requireAdmin("users:manage");
  const findings = releaseReadiness(process.env);
  const blocked = findings.filter((item) => item.state === "blocked").length;
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">AKB Studio / Aeva 3.0</p>
        <h1>Launch checks</h1>
        <p>
          {blocked
            ? `${blocked} configuration checks need attention.`
            : "Required configuration is present. Complete the live checks before launch."}
        </p>
        <p>
          This owner-only screen never displays credential values. It does not
          prove that integrations work, run migrations or change stored data.
        </p>
      </header>
      <ul>
        {findings.map((item) => (
          <li key={item.id}>
            <h2>
              {item.label} · {item.state}
            </h2>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>
      <section>
        <h2>Before locking the release</h2>
        <p>
          Run the production smoke check. Sign in with two-factor
          authentication, open an existing project in Admin, test a contact
          submission you control, and verify feedback and provider responses.
          Check desktop and mobile layouts. Review Personal operations for
          retention and audit integrity. Keep a recoverable database backup.
        </p>
        <p>
          Aeva remains read-only. Social ingestion, account access and
          autonomous external actions are not enabled by this release.
        </p>
      </section>
    </div>
  );
}
