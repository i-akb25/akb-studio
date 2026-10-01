import { VartalapConsole } from "@/features/admin/components/vartalap-console";
export default function AdminVartalapPage() {
  return (
    <main className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Vartalap Inbox</p>
        <h1>Private questions, curated public answers.</h1>
        <p>
          Email remains private in the operational sheet and is never rendered
          here.
        </p>
      </header>
      <VartalapConsole />
    </main>
  );
}
