import Link from "next/link";
import { AdminLogoutButton } from "@/features/admin/components/admin-logout-button";
import { requireAdmin } from "@/features/admin/server/admin-auth";
import "@/features/content/content-surface.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return (
    <div className="akb-admin-shell akb-admin-shell--protected">
      <a className="akb-admin-skip" href="#admin-main">
        Skip to admin content
      </a>
      <header className="akb-admin-header">
        <Link href="/admin" className="akb-admin-brand">
          AKB / Studio Operations
        </Link>
        <nav aria-label="Admin console">
          <ul>
            <li>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li>
              <Link href="/admin/operations">Content data</Link>
            </li>
            <li>
              <Link href="/admin/media">Media</Link>
            </li>
            <li>
              <Link href="/admin/content">Journal & Knowledge</Link>
            </li>
            <li>
              <Link href="/admin/pravaah">Pravaah</Link>
            </li>
            <li>
              <Link href="/admin/aeva">Aeva</Link>
            </li>
            <li>
              <Link href="/admin/studio">Private Studio</Link>
            </li>
            <li>
              <Link href="/admin/analytics">Analytics & health</Link>
            </li>
            <li>
              <Link href="/admin/requests">Requests</Link>
            </li>
            <li>
              <Link href="/admin/audit">Audit</Link>
            </li>
          </ul>
        </nav>
        <div className="akb-admin-header__actions">
          <Link href="/" className="akb-admin-exit">
            View public site
          </Link>
          <AdminLogoutButton />
        </div>
      </header>
      <div id="admin-main" tabIndex={-1} className="akb-admin-main">
        {children}
      </div>
    </div>
  );
}
