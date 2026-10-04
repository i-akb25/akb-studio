import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getOperationsInitialData } from "@/features/admin/server/operations-data";

export default async function AdminSiteSettingsPage() {
  const data = await getOperationsInitialData();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio / Site settings</p>
        <h1>Identity, email and sharing preview</h1>
        <p>
          Update public site identity, displayed contact addresses and the image
          used when the portfolio link is shared.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>Before selecting an image</strong>
        <p>
          Upload a 1200 × 630 image in Media, then select it here. Provider
          delivery credentials and contact routing addresses are not changed on
          this page.
        </p>
      </div>
      <OperationsConsole initialData={data} section="site" />
    </div>
  );
}
