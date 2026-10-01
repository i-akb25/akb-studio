"use client";

import { type FormEvent, useState } from "react";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

export type PublicThread = {
  questionId: string;
  displayName: string;
  question: string;
  reply: string;
  publishedAt: string;
};

type Props = {
  contentId: string;
  contentType: string;
  contentSlug: string;
  contextLabel?: string;
  threads?: PublicThread[];
};

export function VartalapPanel({
  contentId,
  contentType,
  contentSlug,
  contextLabel = "this entry",
  threads = [],
}: Props) {
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
      const response = await fetch("/api/vartalap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          question: data.get("question"),
          anonymous: data.get("anonymous") === "on",
          website: data.get("website"),
          contentId,
          contentType,
          contentSlug,
          noticeAccepted: data.get("noticeAccepted") === "on",
          policyVersion: POLICY_VERSIONS.vartalap,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setState("error");
        setMessage(result.error ?? "Unable to send your question.");
        return;
      }

      form.reset();
      setState("success");
      setMessage(result.message ?? "Question submitted for review.");
    } catch {
      setState("error");
      setMessage("Unable to reach Vartalap.");
    }
  }

  return (
    <aside className="akb-margin-rail" aria-labelledby="vartalap-title">
      <div className="akb-margin-rail__heading">
        <span className="akb-folio">VARTALAP / MARGIN</span>
        <h2 id="vartalap-title">Have a doubt?</h2>
        <p>
          Ask about {contextLabel}. Your email stays private. A question appears
          here only after it is deliberately selected with a response.
        </p>
      </div>

      <form className="akb-margin-form" onSubmit={submit}>
        <label className="akb-field">
          <span>Name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            maxLength={80}
            required
          />
        </label>

        <label className="akb-field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            required
          />
        </label>

        <label className="akb-field">
          <span>Doubt / question</span>
          <textarea name="question" minLength={5} maxLength={2000} required />
        </label>

        <label className="akb-check-row">
          <input type="checkbox" name="anonymous" />
          <span>Use “Anonymous reader” if this is published.</span>
        </label>

        <label className="akb-check-row">
          <input type="checkbox" name="noticeAccepted" required />
          <span>
            I understand my email stays private and only a moderated question,
            display name and response may be published. *
          </span>
        </label>

        <div className="akb-honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Sending…" : "Send to Vartalap"}
        </button>

        <output aria-live="polite" data-state={state}>
          {message}
        </output>
      </form>

      {threads.length > 0 ? (
        <div className="akb-margin-threads">
          <span className="akb-folio">SELECTED EXCHANGE</span>

          {threads.map((thread) => (
            <article key={thread.questionId}>
              <header>
                <strong>{thread.displayName}</strong>
                <time dateTime={thread.publishedAt}>
                  {new Intl.DateTimeFormat("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  }).format(new Date(thread.publishedAt))}
                </time>
              </header>

              <p>{thread.question}</p>

              <div>
                <small>AKB / RESPONSE</small>
                <p>{thread.reply}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
