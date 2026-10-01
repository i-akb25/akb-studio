"use client";

import { useState } from "react";

export function GuardianConsentForm({ token }: { token: string }) {
  const [state, setState] = useState<
    "idle" | "submitting" | "approved" | "rejected" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function decide(action: "approve" | "reject") {
    setState("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/privacy/guardian-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setState("error");
        setMessage(result.message ?? "This request could not be completed.");
        return;
      }
      setState(action === "approve" ? "approved" : "rejected");
      setMessage(result.message ?? "Your choice was recorded.");
    } catch {
      setState("error");
      setMessage("The consent service is temporarily unavailable.");
    }
  }

  if (state === "approved" || state === "rejected") {
    return <output className="guardian-consent__result">{message}</output>;
  }

  return (
    <div className="guardian-consent__actions">
      <button
        type="button"
        disabled={state === "submitting"}
        onClick={() => decide("approve")}
      >
        Approve processing
      </button>
      <button
        type="button"
        disabled={state === "submitting"}
        onClick={() => decide("reject")}
      >
        Reject and delete
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  );
}
