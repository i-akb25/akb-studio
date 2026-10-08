"use client";

import { useState } from "react";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";

const reasons = [
  ["helpful", "Helpful"],
  ["not-helpful", "Not helpful"],
  ["incorrect", "Incorrect"],
  ["too-much-detail", "Too much detail"],
  ["not-enough-detail", "Not enough detail"],
  ["privacy-concern", "Privacy concern"],
] as const;

export function AnswerFeedback({ responseId }: { responseId: string }) {
  const [selected, setSelected] = useState<string>();
  const [comment, setComment] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");

  async function submit(reason: (typeof reasons)[number][0]) {
    if (feedbackBusy || feedbackStatus === "Feedback received.") return;
    setSelected(reason);
    setFeedbackBusy(true);
    setFeedbackStatus("Sending…");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId,
          reason,
          comment: comment.trim() || undefined,
          page: "/aeva",
          policyVersion: POLICY_VERSIONS.aeva,
        }),
      });
      setFeedbackStatus(
        response.ok
          ? "Feedback received."
          : "Feedback is temporarily unavailable.",
      );
    } catch {
      setFeedbackStatus("Feedback is temporarily unavailable.");
    } finally {
      setFeedbackBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t border-border/70 pt-3">
      <p className="text-xs text-muted">Was this answer useful?</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
        {reasons.map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={feedbackBusy || feedbackStatus === "Feedback received."}
            onClick={() => void submit(value)}
            className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            aria-pressed={selected === value}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="mt-3 block max-w-xl">
        <span className="sr-only">Optional feedback comment</span>
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          placeholder="Optional short comment before selecting a reason"
          className="w-full border-0 border-b border-border bg-transparent py-2 text-xs text-foreground outline-none focus:border-accent-warm"
        />
      </label>
      <output
        aria-live="polite"
        className="mt-2 block min-h-4 text-xs text-muted"
      >
        {feedbackStatus}
      </output>
    </div>
  );
}
