import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getOperationsInitialData } from "@/features/admin/server/operations-data";
export default async function AdminAvailabilityPage() {
  const data = await getOperationsInitialData();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio / Status</p>
        <h1>Availability</h1>
        <p>
          Control the time-limited professional availability shown on the public
          portfolio.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>Safe publishing rule</strong>
        <p>
          Set an expiry date. An expired status must not be treated as current
          by Aeva or the public site.
        </p>
      </div>
      <OperationsConsole initialData={data} section="availability" />
    </div>
  );
}
