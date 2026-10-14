"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  contactStates,
  feedbackStates,
  type SubmissionItem,
  type SubmissionResource,
} from "../core/submissions-contract";

const labels = {
  contacts: "Contacts",
  feedback: "Feedback and reports",
  chats: "Shared chats",
};
export function SubmissionsConsole() {
  const [resource, setResource] = useState<SubmissionResource>("contacts");
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubmissionItem>();
  const [state, setState] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const detailRequest = useRef<AbortController | null>(null);
  const locked = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: The refresh counter explicitly reloads server records.
  useEffect(() => {
    const controller = new AbortController();
    detailRequest.current?.abort();
    setSelected(undefined);
    setItems([]);
    setNextCursor(null);
    setConfirmation("");
    setLoading(true);
    const params = new URLSearchParams({
      resource,
      ...(cursor ? { cursor } : {}),
    });
    void fetch(`/api/admin/submissions?${params}`, {
      cache: "no-store",
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Submissions could not be loaded.");
        if (!controller.signal.aborted) {
          setItems(result.data.items);
          setNextCursor(result.data.nextCursor);
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setStatus(
            error instanceof Error
              ? error.message
              : "Submissions could not be loaded.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      detailRequest.current?.abort();
    };
  }, [resource, cursor, refresh]);

  async function open(item: SubmissionItem) {
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    setSelected(undefined);
    setConfirmation("");
    setStatus("Loading record…");
    try {
      const response = await fetch(
        `/api/admin/submissions?${new URLSearchParams({ resource, id: item.id })}`,
        { cache: "no-store", signal: controller.signal },
      );
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) setItems([]);
        throw new Error(result.error || "Record could not be loaded.");
      }
      if (controller.signal.aborted) return;
      setSelected(result.data);
      setState(result.data.state);
      setNote(result.data.ownerNote || "");
      setStatus("");
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof Error
            ? error.message
            : "Record could not be loaded.",
        );
    }
  }
  async function save(remove = false) {
    if (!selected || locked.current) return;
    if (remove && confirmation !== selected.id) {
      setStatus("Type the selected record ID to confirm deletion.");
      return;
    }
    locked.current = true;
    setBusy(true);
    setStatus(remove ? "Deleting…" : "Saving…");
    const prefix =
      resource === "contacts"
        ? "contact"
        : resource === "feedback"
          ? "feedback"
          : "chat";
    const body = {
      action: `${prefix}-${remove ? "delete" : "update"}`,
      id: selected.id,
      revision: selected.revision,
      ...(remove
        ? { confirmation }
        : resource === "contacts"
          ? { state, note }
          : { status: state, ownerNote: note }),
    };
    try {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setItems([]);
          setSelected(undefined);
        }
        throw new Error(
          result.error ||
            "The change could not be confirmed. Refresh before retrying.",
        );
      }
      setStatus(remove ? "Record deleted from its source storage." : "Saved.");
      setSelected(undefined);
      setConfirmation("");
      setNote("");
      setRefresh((n) => n + 1);
    } catch (error) {
      setStatus(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "The change could not be confirmed. Refresh the record before retrying.",
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="akb-admin-operations">
      <div className="akb-admin-form">
        <label>
          Inbox
          <select
            value={resource}
            disabled={busy}
            onChange={(e) => {
              setResource(e.target.value as SubmissionResource);
              setCursor(undefined);
              setFilter("");
              setStatus("");
            }}
          >
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Filter this page
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Title, status or sender"
          />
        </label>
        <button
          type="button"
          disabled={busy || loading}
          onClick={() => {
            setStatus("");
            setRefresh((n) => n + 1);
          }}
        >
          Refresh
        </button>
      </div>
      <p>
        <Link href="/admin/requests">Privacy requests</Link> ·{" "}
        <Link href="/admin/service-health">Service health</Link>
      </p>
      <output aria-live="polite">{status}</output>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="akb-admin-list">
          {items
            .filter((item) =>
              `${item.title} ${item.state} ${item.description || ""}`
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((item) => (
              <article key={item.id}>
                <div>
                  <h2>{item.title}</h2>
                  <p>
                    {item.state} · {item.createdAt}
                  </p>
                  {item.description ? <p>{item.description}</p> : null}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void open(item)}
                >
                  Open record
                </button>
              </article>
            ))}
          {!items.length ? <p>No records available in this inbox.</p> : null}
        </div>
      )}
      <div className="akb-admin-form">
        <button
          type="button"
          disabled={!cursor || busy || loading}
          onClick={() => setCursor(undefined)}
        >
          Newest
        </button>
        <button
          type="button"
          disabled={!nextCursor || busy || loading}
          onClick={() => {
            if (nextCursor) setCursor(nextCursor);
          }}
        >
          Older records
        </button>
      </div>
      {selected ? (
        <section className="akb-admin-form" aria-label="Selected submission">
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <p>
            Record ID: <code>{selected.id}</code>
          </p>
          {selected.body ? (
            <div className="akb-admin-submission-text">{selected.body}</div>
          ) : null}
          {selected.excerpt ? (
            <div>
              <h3>Consented report excerpt</h3>
              <div className="akb-admin-submission-text">
                {selected.excerpt}
              </div>
            </div>
          ) : null}
          {selected.messages?.map((message) => (
            <article key={message.id}>
              <strong>{message.role}</strong>
              <p className="akb-admin-submission-text">
                {message.text ??
                  "This message could not be decrypted with the configured key."}
              </p>
            </article>
          ))}
          {selected.notes?.length ? (
            <div>
              <h3>Latest owner notes</h3>
              {selected.notes.map((n) => (
                <p key={n.id} className="akb-admin-submission-text">
                  {n.createdAt}: {n.body}
                </p>
              ))}
            </div>
          ) : null}
          {resource !== "chats" ? (
            <>
              <label>
                Status
                <select
                  value={state}
                  disabled={busy}
                  onChange={(e) => setState(e.target.value)}
                >
                  {(resource === "contacts"
                    ? contactStates
                    : feedbackStates
                  ).map((value) => (
                    <option key={value} value={value}>
                      {value === "CLOSED" ? "CLOSED / archived" : value}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {resource === "contacts" ? "Add an owner note" : "Owner note"}
                <textarea
                  value={note}
                  disabled={busy}
                  maxLength={2000}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button type="button" disabled={busy} onClick={() => void save()}>
                Save status and note
              </button>
            </>
          ) : null}
          <p>
            Deletion removes this record from{" "}
            {resource === "feedback"
              ? "the source Google Sheet"
              : "Neon, including its linked records"}
            . It does not erase existing email deliveries, backups or copies you
            exported. Audit entries retain the record ID and action, not the
            message content.
          </p>
          {resource === "chats" && selected.state === "active" ? (
            <p>Active shared chats cannot be deleted until they end.</p>
          ) : (
            <>
              <label>
                Type this record ID to confirm permanent deletion
                <input
                  value={confirmation}
                  disabled={busy}
                  autoComplete="off"
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
              <button
                type="button"
                disabled={busy || confirmation !== selected.id}
                onClick={() => void save(true)}
              >
                Permanently delete
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              detailRequest.current?.abort();
              setSelected(undefined);
              setNote("");
              setConfirmation("");
            }}
          >
            Close record
          </button>
        </section>
      ) : null}
    </section>
  );
}
