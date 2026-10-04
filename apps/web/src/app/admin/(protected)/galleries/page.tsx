import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getOperationsInitialData } from "@/features/admin/server/operations-data";
export default async function AdminGalleriesPage() {
  const data = await getOperationsInitialData();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio / Creative work</p>
        <h1>Galleries</h1>
        <p>
          Create a collection first, upload its images in Media, then attach
          each image using the returned asset ID.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>Correct order</strong>
        <p>
          1. Create gallery. 2. Upload image. 3. Copy asset ID. 4. Add gallery
          image with useful alt text.
        </p>
      </div>
      <OperationsConsole initialData={data} section="galleries" />
    </div>
  );
}
