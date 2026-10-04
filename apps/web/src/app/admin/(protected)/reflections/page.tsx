import { OperationsConsole } from "@/features/admin/components/operations-console";
import { getOperationsInitialData } from "@/features/admin/server/operations-data";
export default async function AdminReflectionsPage() {
  const data = await getOperationsInitialData();
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Portfolio / Reflection</p>
        <h1>Daily Sanskrit Reflection</h1>
        <p>
          Create or revise the text, translation, interpretation, source and
          publication date.
        </p>
      </header>
      <div className="akb-admin-guide">
        <strong>Before publishing</strong>
        <p>
          Verify the Sanskrit, transliteration, translation and source. Do not
          publish an unverified attribution.
        </p>
      </div>
      <OperationsConsole initialData={data} section="reflections" />
    </div>
  );
}
