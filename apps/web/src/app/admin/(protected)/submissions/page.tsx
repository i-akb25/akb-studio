import { SubmissionsConsole } from "@/features/admin/components/submissions-console";
import { requireAdmin } from "@/features/admin/server/admin-auth";

export default async function SubmissionsPage() {
  await requireAdmin("submissions:manage");
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Owner inbox</p>
        <h1>Submissions</h1>
        <p>
          Review contacts, feedback and explicitly shared conversations.
          Original visitor messages stay read-only.
        </p>
      </header>
      <SubmissionsConsole />
    </div>
  );
}
