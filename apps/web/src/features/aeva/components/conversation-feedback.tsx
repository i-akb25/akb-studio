"use client";

import { useState } from "react";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import type { AevaConversationTurn } from "../model";

const feedbackReasons = [
  ["helpful", "Helpful"],
  ["not-helpful", "Not helpful"],
  ["incorrect", "Incorrect"],
  ["irrelevant", "Irrelevant"],
  ["too-much-detail", "Too detailed"],
  ["privacy-concern", "Privacy concern"],
] as const;

const reportReasons = [
  ["incorrect", "Incorrect information"],
  ["irrelevant", "Irrelevant response"],
  ["unsafe", "Unsafe or inappropriate"],
  ["privacy-concern", "Privacy concern"],
  ["broken-conversation", "Broken conversation or layout"],
  ["other", "Other problem"],
] as const;

type FeedbackReason =
  | (typeof feedbackReasons)[number][0]
  | (typeof reportReasons)[number][0];

export function ConversationFeedback({
  responseId,
  variant,
  transcript,
  onClose,
}: {
  responseId: string;
  variant: "feedback" | "report";
  transcript: readonly AevaConversationTurn[];
  onClose?: () => void;
}) {
  const [selected, setSelected] = useState<FeedbackReason>();
  const [comment, setComment] = useState("");
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const reasons = variant === "report" ? reportReasons : feedbackReasons;

  async function submit() {
    if (!selected || busy || status === "Received. Thank you.") return;
    setBusy(true);
    setStatus("Sending…");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId,
          kind: variant,
          reason: selected,
          comment: comment.trim() || undefined,
          page: "/aeva",
          policyVersion: POLICY_VERSIONS.aeva,
          includeTranscript: variant === "report" && includeTranscript,
          ...(variant === "report" && includeTranscript
            ? { transcript: transcript.slice(-8) }
            : {}),
        }),
      });
      setStatus(
        response.ok
          ? "Received. Thank you."
          : "This service is temporarily unavailable.",
      );
    } catch {
      setStatus("This service is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="shrink-0 border-t border-border bg-surface/35 py-5"
      aria-label={variant === "report" ? "Report this chat" : "Chat feedback"}
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {variant === "report"
              ? "Report a problem with this chat"
              : "How was this conversation?"}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {variant === "report"
              ? "Choose the closest problem. The conversation is not included unless you explicitly allow a redacted excerpt."
              : "One response is enough. Feedback is reviewed to improve Aeva for future visitors."}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Close
          </button>
        ) : null}
      </div>

      <fieldset className="mt-4">
        <legend className="sr-only">Select a reason</legend>
        <div className="flex flex-wrap gap-2">
          {reasons.map(([value, label]) => (
            <label
              key={value}
              className="cursor-pointer rounded-full border border-border px-3 py-2 text-xs text-muted has-[:checked]:border-accent-warm has-[:checked]:text-foreground"
            >
              <input
                type="radio"
                name={`${variant}-reason`}
                value={value}
                checked={selected === value}
                onChange={() => setSelected(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block max-w-2xl">
        <span className="sr-only">Optional comment</span>
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          placeholder="Optional short comment"
          className="w-full border-0 border-b border-border bg-transparent py-2 text-sm text-foreground outline-none focus:border-accent-warm"
        />
      </label>

      {variant === "report" ? (
        <label className="mt-4 flex max-w-2xl items-start gap-2 text-xs leading-5 text-muted">
          <input
            type="checkbox"
            checked={includeTranscript}
            onChange={(event) => setIncludeTranscript(event.target.checked)}
            className="mt-0.5 size-4 shrink-0"
          />
          Include a server-redacted excerpt of the latest conversation turns in
          this report. Leave unchecked to send only the reason, response ID and
          optional comment.
        </label>
      ) : null}

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!selected || busy || status === "Received. Thank you."}
          className="inline-flex min-h-10 items-center rounded-full bg-foreground px-4 text-xs font-semibold text-background disabled:opacity-40"
        >
          {variant === "report" ? "Submit report" : "Send feedback"}
        </button>
        <output aria-live="polite" className="text-xs text-muted">
          {status}
        </output>
      </div>
    </section>
  );
}
