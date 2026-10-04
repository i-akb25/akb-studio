import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getOperationsInitialData } from "@/features/admin/server/operations-data";
export default async function AdminProfilePage() {
  const data = await getOperationsInitialData();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio / About</p>
        <h1>Profile and public identity</h1>
        <p>
          Changes here affect the About profile. Upload an image in Media first,
          then use its asset ID.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>What this controls</strong>
        <p>
          Name, headline, biography, location, public email, profile image and
          publication state.
        </p>
      </div>
      <OperationsConsole initialData={data} section="profile" />
    </div>
  );
}
