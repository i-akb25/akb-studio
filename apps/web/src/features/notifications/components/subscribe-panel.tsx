"use client";

import { type FormEvent, useState } from "react";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

export function SubscribePanel() {
  const [state, setState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: data.get("email"),
          website: data.get("website"),
          journal: data.get("journal") === "on",
          knowledge: data.get("knowledge") === "on",
          noticeAccepted: data.get("noticeAccepted") === "on",
          policyVersion: POLICY_VERSIONS.subscription,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setState("error");
        setMessage(result.error ?? "Unable to subscribe.");
        return;
      }

      form.reset();
      setState("success");
      setMessage(result.message ?? "Publication signal configured.");
    } catch {
      setState("error");
      setMessage("Unable to reach the publication service.");
    }
  }

  return (
    <section className="akb-dispatch" aria-labelledby="dispatch-title">
      <div className="akb-dispatch__identity">
        <span className="akb-folio">PUBLICATION SIGNAL / 08</span>
        <h2 id="dispatch-title">New work, only when it is ready.</h2>
        <p>
          Journal and Knowledge publication notices only. No promotional
          sequence and no Vartalap reply mail. Withdraw through the privacy
          request route or the unsubscribe control included with a notice.
        </p>
      </div>

      <form className="akb-dispatch__form" onSubmit={submit}>
        <label className="akb-field">
          <span>Email address</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
          />
        </label>

        <fieldset className="akb-dispatch__channels">
          <legend>Channels</legend>

          <label>
            <input type="checkbox" name="journal" defaultChecked />
            <span>Engineering Journal</span>
          </label>

          <label>
            <input type="checkbox" name="knowledge" defaultChecked />
            <span>Knowledge Hub</span>
          </label>
        </fieldset>

        <div className="akb-honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <label className="akb-check-row">
          <input type="checkbox" name="noticeAccepted" required />
          <span>
            Send only the publication notices selected above. I have read the{" "}
            <a href="/privacy">Privacy Notice</a>. *
          </span>
        </label>

        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Saving…" : "Subscribe"}
        </button>

        <output aria-live="polite" data-state={state}>
          {message}
        </output>
      </form>
    </section>
  );
}
