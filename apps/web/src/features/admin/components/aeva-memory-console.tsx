"use client";

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

export function AevaMemoryConsole() {
  const [status, setStatus] = useState("");
  async function run(
    event: FormEvent<HTMLFormElement>,
    resource: "memory" | "source",
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("Saving…");
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      await submit({ resource, ...values });
      setStatus(
        "Saved. Public retrieval rules apply immediately to published entries.",
      );
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    }
  }

  return (
    <div className="akb-admin-operations">
      <output aria-live="polite">{status}</output>
      <section>
        <h2>Personal memory</h2>
        <p>
          Only PUBLIC_AEVA and RESPONSE_POLICY entries marked PUBLISHED can
          reach public answers. OWNER_ONLY is never retrieved publicly.
        </p>
        <form onSubmit={(event) => run(event, "memory")}>
          <label>
            <span>Title</span>
            <input name="title" required minLength={2} maxLength={140} />
          </label>
          <label>
            <span>Information or response policy</span>
            <textarea name="content" required minLength={3} maxLength={8000} />
          </label>
          <label>
            <span>Visibility</span>
            <select name="visibility" defaultValue="OWNER_ONLY">
              <option>PUBLIC_AEVA</option>
              <option>RESPONSE_POLICY</option>
              <option>OWNER_ONLY</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label>
            <span>State</span>
            <select name="state" defaultValue="DRAFT">
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label>
            <span>Optional source label</span>
            <input name="sourceLabel" maxLength={120} />
          </label>
          <label>
            <span>Optional source URL</span>
            <input name="sourceUrl" type="url" maxLength={2048} />
          </label>
          <button type="submit">Add memory</button>
        </form>
      </section>
      <section>
        <h2>Approved URL vault</h2>
        <p>
          Add canonical public links such as GitHub, LinkedIn, or another
          official profile. Notes are the trusted summary; live page content
          remains untrusted data.
        </p>
        <form onSubmit={(event) => run(event, "source")}>
          <label>
            <span>Title</span>
            <input name="title" required minLength={2} maxLength={140} />
          </label>
          <label>
            <span>Canonical HTTPS URL</span>
            <input name="url" type="url" required maxLength={2048} />
          </label>
          <label>
            <span>Approved notes</span>
            <textarea name="notes" maxLength={5000} />
          </label>
          <button type="submit">Approve source</button>
        </form>
      </section>
    </div>
  );
}
