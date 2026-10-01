"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";

type Item = {
  questionId: string;
  contentType: string;
  contentSlug: string;
  name: string;
  question: string;
  anonymous: boolean;
  submittedAt: string;
  reply: string;
  public: boolean;
};

export function VartalapConsole() {
  const [items, setItems] = useState<Item[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/vartalap", {
      cache: "no-store",
    });

    const result = (await response.json()) as { data?: Item[] };
    setItems(result.data ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>, questionId: string) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    setBusyId(questionId);

    try {
      await fetch("/api/admin/vartalap", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          questionId,
          reply: data.get("reply"),
          public: data.get("public") === "on",
        }),
      });

      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="akb-admin-vartalap">
      {items.length === 0 ? (
        <section className="akb-admin-empty">
          <span className="akb-folio">VARTALAP INBOX</span>
          <h2>No submissions waiting.</h2>
        </section>
      ) : (
        items.map((item) => (
          <article className="akb-admin-vartalap__entry" key={item.questionId}>
            <header>
              <div>
                <span className="akb-folio">
                  {item.contentType} / {item.contentSlug}
                </span>
                <h2>{item.anonymous ? "Anonymous reader" : item.name}</h2>
              </div>

              <time dateTime={item.submittedAt}>
                {new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(new Date(item.submittedAt))}
              </time>
            </header>

            <blockquote>{item.question}</blockquote>

            <form onSubmit={(event) => submit(event, item.questionId)}>
              <label className="akb-field">
                <span>Response</span>
                <textarea
                  name="reply"
                  defaultValue={item.reply}
                  maxLength={4000}
                  required
                />
              </label>

              <label className="akb-check-row">
                <input
                  type="checkbox"
                  name="public"
                  defaultChecked={item.public}
                />
                <span>Show this curated Q&A on the article</span>
              </label>

              <button type="submit" disabled={busyId === item.questionId}>
                {busyId === item.questionId ? "Saving…" : "Save response"}
              </button>
            </form>
          </article>
        ))
      )}
    </div>
  );
}
