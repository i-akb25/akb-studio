"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/features/auth/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);

    if (step === "credentials") {
      const result = await authClient.signIn.email({
        email: String(data.get("email") ?? "").trim(),
        password: String(data.get("password") ?? ""),
      });
      setPending(false);
      if (result.error)
        return setError("Invalid credentials or access is disabled.");
      if (
        result.data &&
        "twoFactorRedirect" in result.data &&
        result.data.twoFactorRedirect
      )
        return setStep("totp");
    } else {
      const result = await authClient.twoFactor.verifyTotp({
        code: String(data.get("code") ?? "").replace(/\s/g, ""),
        trustDevice: false,
      });
      setPending(false);
      if (result.error)
        return setError("Invalid or expired authenticator code.");
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="akb-admin-login" onSubmit={submit}>
      {step === "credentials" ? (
        <>
          <label>
            <span>Owner email</span>
            <input type="email" name="email" autoComplete="username" required />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              minLength={14}
              required
            />
          </label>
        </>
      ) : (
        <label>
          <span>Authenticator code</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            required
          />
        </label>
      )}
      <button type="submit" disabled={pending}>
        {pending
          ? "Verifying…"
          : step === "credentials"
            ? "Continue securely"
            : "Open Studio"}
      </button>
      <output aria-live="polite">{error}</output>
    </form>
  );
}
