"use client";

import { type FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };
type Reference = { id: string; title: string; label?: string; url?: string };

export function PrivateAevaConsole() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (!value || busy) return;
    setBusy(true);
    setStatus("Checking approved owner sources…");
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: value }]);
    try {
      const response = await fetch("/api/admin/aeva/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, history: messages.slice(-8) }),
      });
      const result = (await response.json()) as {
        answer?: string;
        references?: Reference[];
        error?: string;
      };
      if (!response.ok || !result.answer)
        throw new Error(result.error ?? "Private Aeva is unavailable.");
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.answer ?? "" },
      ]);
      setReferences(result.references ?? []);
      setStatus("");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Private Aeva is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="private-aeva-heading">
      <p className="akb-kicker">Owner-only domain</p>
      <h2 id="private-aeva-heading">Private Aeva foundation</h2>
      <p>
        Read-only access to explicitly published OWNER_ONLY memories and private
        approved-source notes. Conversations remain in this browser tab and are
        not written to the database.
      </p>
      {messages.length ? (
        <ol aria-live="polite">
          {messages.map((message, index) => (
            <li key={`${message.role}-${index}`}>
              <strong>
                {message.role === "user" ? "You" : "Private Aeva"}
              </strong>
              <p>{message.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p>
          No private conversation in this tab. Ask about an explicitly approved
          owner memory; Admin records and external accounts remain unavailable.
        </p>
      )}
      {references.length ? (
        <ul aria-label="Private answer references">
          {references.map((item) => (
            <li key={item.id}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.label ?? item.title}
                </a>
              ) : (
                (item.label ?? item.title)
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={ask}>
        <label>
          <span>Private owner question</span>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            minLength={2}
            maxLength={1000}
            required
          />
        </label>
        <div>
          <button type="submit" disabled={busy || !question.trim()}>
            {busy ? "Checking…" : "Ask Private Aeva"}
          </button>
          <button
            type="button"
            disabled={busy || messages.length === 0}
            onClick={() => {
              setMessages([]);
              setReferences([]);
              setStatus("");
            }}
          >
            Clear this tab
          </button>
        </div>
      </form>
      <output aria-live="polite">{status}</output>
      <p>
        Disabled in 2.1: email, calendar, GitHub, VEYRA, contacts, audit
        records, autonomous actions and external writes.
      </p>
    </section>
  );
}
