import { ContentConsole } from "@/features/admin/components/content-console";
import { getAdminContentEntries } from "@/features/content/server/content-source";

export default async function AdminContentPage() {
  const entries = await getAdminContentEntries();
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Editorial control</p>
        <h1>Publish Journal & Knowledge</h1>
        <p>
          Upload or paste, classify, attach evidence, choose notification
          behavior and publish.
        </p>
      </header>
      <ContentConsole entries={entries} />
    </main>
  );
}
