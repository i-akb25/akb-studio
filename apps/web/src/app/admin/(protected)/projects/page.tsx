import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getOperationsInitialData } from "@/features/admin/server/operations-data";
export default async function AdminProjectsPage() {
  const data = await getOperationsInitialData();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio / Work</p>
        <h1>Project registry</h1>
        <p>
          Select an existing project before editing it, or keep “Create a new
          project” selected for a new record.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>Homepage placement</strong>
        <p>
          Published controls public visibility. Featured plus a homepage order
          controls homepage eligibility. Cover asset IDs come from Media.
        </p>
      </div>
      <OperationsConsole initialData={data} section="projects" />
    </div>
  );
}
