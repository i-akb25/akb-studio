import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getDatabaseHealth } from "@/server/db/database-health";

export default async function OperationsPage() {
  const database = await getDatabaseHealth();
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Controlled data</p>
        <h1>Portfolio operations</h1>
        <p>
          Edit structured About, project, reflection, availability and gallery
          records. Git-backed editorial bodies remain in the publishing
          workflow.
        </p>
      </header>
      <section aria-labelledby="database-capacity-heading">
        <h2 id="database-capacity-heading">Database capacity</h2>
        {database.available &&
        database.bytes !== null &&
        database.percent !== null ? (
          <p>
            {(database.bytes / 1024 / 1024).toFixed(1)} MB of 500 MB used (
            {database.percent.toFixed(1)}%).
            {database.warning === "critical"
              ? " Critical: act before the free allowance is exhausted."
              : null}
            {database.warning === "warning"
              ? " Warning: schedule cleanup and verify the latest export."
              : null}
            {database.warning === "notice"
              ? " Notice: review growth and retention."
              : null}
          </p>
        ) : (
          <p>
            Database capacity is temporarily unavailable. Public fallbacks are
            unaffected.
          </p>
        )}
      </section>
      <OperationsConsole />
    </main>
  );
}
