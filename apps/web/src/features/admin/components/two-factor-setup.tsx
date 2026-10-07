"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/features/auth/client";

export function TwoFactorSetup() {
  const router = useRouter();
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.enable({
        password: String(data.get("password") ?? ""),
      });
      if (result.error || !result.data || result.data.method !== "totp") {
        setError("Two-factor setup could not be started.");
        return;
      }
      setTotpUri(result.data.totpURI);
      setBackupCodes(result.data.backupCodes);
    } catch {
      setError("The authentication service could not be reached. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: String(data.get("code") ?? "").replace(/\s/g, ""),
        trustDevice: false,
      });
      if (result.error) {
        setError("The authenticator code is invalid.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("The authentication service could not be reached. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!totpUri)
    return (
      <form className="akb-admin-login" onSubmit={enable}>
        <label>
          <span>Confirm password</span>
          <input type="password" name="password" minLength={14} required />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create authenticator secret"}
        </button>
        <output aria-live="polite">{error}</output>
      </form>
    );

  return (
    <div className="akb-admin-login">
      <p>Add this URI to your authenticator app:</p>
      <code>{totpUri}</code>
      <p>Store these one-time recovery codes offline:</p>
      <pre>{backupCodes.join("\n")}</pre>
      <form onSubmit={verify}>
        <label>
          <span>First six-digit code</span>
          <input name="code" inputMode="numeric" pattern="[0-9]{6}" required />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Verifying…" : "Verify and activate"}
        </button>
      </form>
      <output aria-live="polite">{error}</output>
    </div>
  );
}
