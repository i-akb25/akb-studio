import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { requireAdmin } from "@/features/admin/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();
  return (
    <div className="akb-admin-shell akb-admin-shell--protected">
      <a className="akb-admin-skip" href="#admin-main">
        Skip to admin content
      </a>
      <AdminSidebar userLabel={session.user.name || session.user.email} />
      <main id="admin-main" tabIndex={-1} className="akb-admin-main">
        {children}
      </main>
    </div>
  );
}
