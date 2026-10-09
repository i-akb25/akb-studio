"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

async function submit(payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/aeva", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Save failed");
}

type Memory = {
  id: string;
  title: string;
  content: string;
  visibility: string;
  state: string;
  sourceLabel: string | null;
  sourceUrl: string | null;
};

type Source = {
  id: string;
  title: string;
  url: string;
  notes: string | null;
  publicAllowed: boolean;
};

export function AevaMemoryConsole({
  memories,
  sources,
  canManagePrivate,
}: {
  memories: Memory[];
  sources: Source[];
  canManagePrivate: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [memoryId, setMemoryId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const selectedMemory = memories.find((item) => item.id === memoryId);
  const selectedSource = sources.find((item) => item.id === sourceId);
  async function run(
    event: FormEvent<HTMLFormElement>,
    resource: "memory" | "source",
  ) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setStatus("Saving…");
    try {
      const values: Record<string, unknown> = Object.fromEntries(
        new FormData(form).entries(),
      );
      if (!values.id) delete values.id;
      if (resource === "source") {
        values.publicAllowed = canManagePrivate
          ? values.publicAllowed === "on"
          : true;
      }
      await submit({ resource, ...values });
      setStatus(
        "Saved. Public retrieval rules apply immediately to published entries.",
      );
      if (!values.id) form.reset();
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="akb-admin-operations">
      <output aria-live="polite">{status}</output>
      <section>
        <h2>Personal memory</h2>
        <p>
          PUBLIC_AEVA entries can reach public answers. OWNER_ONLY entries use
          the independent private domain and are never retrieved publicly.
        </p>
        <label>
          <span>Edit an existing entry or create a new one</span>
          <select
            value={memoryId}
            onChange={(event) => setMemoryId(event.target.value)}
          >
            <option value="">Create a new memory</option>
            {memories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <form
          key={selectedMemory?.id ?? "new-memory"}
          onSubmit={(event) => run(event, "memory")}
        >
          <input type="hidden" name="id" value={selectedMemory?.id ?? ""} />
          <label>
            <span>Title</span>
            <input
              name="title"
              defaultValue={selectedMemory?.title}
              required
              minLength={2}
              maxLength={140}
            />
          </label>
          <label>
            <span>Information or response policy</span>
            <textarea
              name="content"
              defaultValue={selectedMemory?.content}
              required
              minLength={3}
              maxLength={8000}
            />
          </label>
          <label>
            <span>Visibility</span>
            <select
              name="visibility"
              defaultValue={
                selectedMemory?.visibility ??
                (canManagePrivate ? "OWNER_ONLY" : "PUBLIC_AEVA")
              }
            >
              <option>PUBLIC_AEVA</option>
              {canManagePrivate ? <option>RESPONSE_POLICY</option> : null}
              {canManagePrivate ? <option>OWNER_ONLY</option> : null}
              {canManagePrivate ? <option>ARCHIVED</option> : null}
            </select>
          </label>
          <label>
            <span>State</span>
            <select
              name="state"
              defaultValue={selectedMemory?.state ?? "DRAFT"}
            >
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label>
            <span>Optional source label</span>
            <input
              name="sourceLabel"
              defaultValue={selectedMemory?.sourceLabel ?? ""}
              maxLength={120}
            />
          </label>
          <label>
            <span>Optional source URL</span>
            <input
              name="sourceUrl"
              type="url"
              defaultValue={selectedMemory?.sourceUrl ?? ""}
              maxLength={2048}
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : selectedMemory ? "Save memory" : "Add memory"}
          </button>
        </form>
      </section>
      <section>
        <h2>Approved URL vault</h2>
        <p>
          Add canonical public links such as GitHub, LinkedIn, or another
          official profile. Notes are the trusted summary; live page content
          remains untrusted data.
        </p>
        <label>
          <span>Edit an approved URL or create a new one</span>
          <select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
          >
            <option value="">Create a new source</option>
            {sources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <form
          key={selectedSource?.id ?? "new-source"}
          onSubmit={(event) => run(event, "source")}
        >
          <input type="hidden" name="id" value={selectedSource?.id ?? ""} />
          <label>
            <span>Title</span>
            <input
              name="title"
              defaultValue={selectedSource?.title}
              required
              minLength={2}
              maxLength={140}
            />
          </label>
          <label>
            <span>Canonical HTTPS URL</span>
            <input
              name="url"
              type="url"
              defaultValue={selectedSource?.url}
              required
              maxLength={2048}
            />
          </label>
          <label>
            <span>Approved notes</span>
            <textarea
              name="notes"
              defaultValue={selectedSource?.notes ?? ""}
              maxLength={5000}
            />
          </label>
          {canManagePrivate ? (
            <label>
              <input
                name="publicAllowed"
                type="checkbox"
                defaultChecked={selectedSource?.publicAllowed ?? true}
              />
              <span>Allow this source in public Aeva</span>
            </label>
          ) : null}
          <button type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : selectedSource
                ? "Save source"
                : "Approve source"}
          </button>
        </form>
      </section>
    </div>
  );
}
