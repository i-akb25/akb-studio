import { ServiceHealthConsole } from "@/features/admin/components/service-health-console";
import { requireAdmin } from "@/features/admin/server/admin-auth";

export default async function ServiceHealthPage() {
  await requireAdmin("submissions:manage");
  return (
    <div className="akb-admin-page">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">Private operations</p>
        <h1>Service health</h1>
        <p>
          Last recorded service results. A past success does not guarantee the
          service is available now.
        </p>
      </header>
      <ServiceHealthConsole />
    </div>
  );
}
