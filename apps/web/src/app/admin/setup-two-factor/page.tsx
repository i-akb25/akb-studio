import { redirect } from "next/navigation";
import { TwoFactorSetup } from "@/features/admin/components/two-factor-setup";
import { getAdminSession } from "@/features/admin/server/admin-auth";
import "@/features/content/content-surface.css";

export default async function SetupTwoFactorPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.user.twoFactorEnabled) redirect("/admin");
  return (
    <main className="akb-admin-shell akb-admin-shell--login">
      <div className="akb-admin-login-panel">
        <p className="akb-kicker">Required security</p>
        <h1>Activate two-factor authentication</h1>
        <p>The private Studio remains locked until TOTP is verified.</p>
        <TwoFactorSetup />
      </div>
    </main>
  );
}
