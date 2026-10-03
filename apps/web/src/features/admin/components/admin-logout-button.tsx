"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/features/auth/client";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");

    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Sign out failed. Please try again.");
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="akb-admin-logout-control">
      <button
        type="button"
        className="akb-admin-logout"
        disabled={pending}
        onClick={logout}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      <output className="sr-only" aria-live="polite">
        {error}
      </output>
    </span>
  );
}
