import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/server/auth";
import { hasTrustedOrigin } from "@/server/security/request";

export type AdminRole = "owner" | "editor" | "moderator" | "viewer";
export type AdminPermission =
  | "content:read"
  | "content:write"
  | "content:publish"
  | "media:write"
  | "contact:moderate"
  | "audit:read"
  | "analytics:read"
  | "users:manage";

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  owner: [
    "content:read",
    "content:write",
    "content:publish",
    "media:write",
    "contact:moderate",
    "audit:read",
    "analytics:read",
    "users:manage",
  ],
  editor: ["content:read", "content:write", "content:publish", "media:write"],
  moderator: ["content:read", "contact:moderate"],
  viewer: ["content:read"],
};

function roleOf(value: unknown): AdminRole | null {
  return typeof value === "string" && Object.hasOwn(ROLE_PERMISSIONS, value)
    ? (value as AdminRole)
    : null;
}

export async function getAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = roleOf(session?.user.role);
  if (!session || !role) return null;
  return { ...session, role };
}

export async function hasAdminSession(): Promise<boolean> {
  const session = await getAdminSession();
  return Boolean(session?.user.twoFactorEnabled);
}

export async function requireAdmin(
  permission: AdminPermission = "content:read",
) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!session.user.twoFactorEnabled) redirect("/admin/setup-two-factor");
  if (!ROLE_PERMISSIONS[session.role].includes(permission))
    redirect("/admin/forbidden");
  return session;
}

export async function canAdmin(permission: AdminPermission): Promise<boolean> {
  const session = await getAdminSession();
  return Boolean(
    session?.user.twoFactorEnabled &&
      ROLE_PERMISSIONS[session.role].includes(permission),
  );
}

export function assertSameOrigin(request: Request): void {
  if (!hasTrustedOrigin(request)) throw new Error("Origin mismatch");
}
