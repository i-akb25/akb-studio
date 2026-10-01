import { ContentConsole } from "@/features/admin/components/content-console";
export default function AdminContentPage() {
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
      <ContentConsole />
    </main>
  );
}
