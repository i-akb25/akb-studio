"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/features/auth/client";

export function TwoFactorSetup() {
  const router = useRouter();
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await authClient.twoFactor.enable({
      password: String(data.get("password") ?? ""),
    });
    if (result.error || !result.data || result.data.method !== "totp")
      return setError("Two-factor setup could not be started.");
    setTotpUri(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await authClient.twoFactor.verifyTotp({
      code: String(data.get("code") ?? ""),
      trustDevice: false,
    });
    if (result.error) return setError("The authenticator code is invalid.");
    router.replace("/admin");
    router.refresh();
  }

  if (!totpUri)
    return (
      <form className="akb-admin-login" onSubmit={enable}>
        <label>
          <span>Confirm password</span>
          <input type="password" name="password" minLength={14} required />
        </label>
        <button type="submit">Create authenticator secret</button>
        <output>{error}</output>
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
        <button type="submit">Verify and activate</button>
      </form>
      <output>{error}</output>
    </div>
  );
}
