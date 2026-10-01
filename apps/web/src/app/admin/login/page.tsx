import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/features/admin/components/admin-login-form";
import { hasAdminSession } from "@/features/admin/server/admin-auth";
import "@/features/content/content-surface.css";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  return (
    <>
      <a className="akb-admin-skip" href="#admin-login-main">
        Skip to sign in
      </a>
      <main
        id="admin-login-main"
        tabIndex={-1}
        className="akb-admin-shell akb-admin-shell--login"
      >
        <div className="akb-admin-login-panel">
          <p className="akb-kicker">Private operations</p>
          <h1>AKB Studio Admin</h1>
          <p>
            Owner-only access. Password and authenticator verification are
            required.
          </p>
          <AdminLoginForm />
        </div>
      </main>
    </>
  );
}
