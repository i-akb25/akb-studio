"use client";

import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  isOfflineRecord,
  mergeOfflineRecords,
  type OfflineRecord,
  type OfflineRecordKind,
} from "../model";

const STORAGE_KEY = "akb-offline-workspace-v1";

function safePublicUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeRecord(record: OfflineRecord): OfflineRecord {
  const safeUrl = safePublicUrl(record.url);
  const { url: _url, ...rest } = record;
  return safeUrl ? { ...rest, url: safeUrl } : rest;
}

export function OfflineWorkspace() {
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Stored only in this browser.");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) setRecords(parsed.filter(isOfflineRecord));
    } catch {
      setStatus(
        "The local workspace could not be read. No data was sent anywhere.",
      );
    }
  }, []);

  function persist(next: OfflineRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRecords(next);
      return true;
    } catch {
      setStatus(
        "This browser blocked local storage. Export any visible records before leaving the page.",
      );
      return false;
    }
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? records.filter((record) =>
          `${record.title} ${record.body} ${record.url ?? ""}`
            .toLowerCase()
            .includes(needle),
        )
      : records;
  }, [query, records]);

  function add(form: FormData) {
    const now = new Date().toISOString();
    const submittedUrl = safePublicUrl(String(form.get("url") ?? "").trim());
    const record: OfflineRecord = {
      id: crypto.randomUUID(),
      kind: String(form.get("kind")) as OfflineRecordKind,
      title: String(form.get("title") ?? "").trim(),
      body: String(form.get("body") ?? "").trim(),
      ...(submittedUrl ? { url: submittedUrl } : {}),
      revision: 1,
      updatedAt: now,
    };
    if (!record.title) return;
    if (persist([record, ...records])) {
      setStatus("Saved locally. It will not sync or publish automatically.");
    }
  }

  function exportRecords() {
    const blob = new Blob([JSON.stringify({ version: 1, records }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `akb-offline-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importRecords(file: File) {
    try {
      const value = JSON.parse(await file.text()) as { records?: unknown };
      const incoming = Array.isArray(value.records)
        ? value.records.filter(isOfflineRecord).map(sanitizeRecord)
        : [];
      persist(mergeOfflineRecords(records, incoming));
      setStatus(
        `Imported ${incoming.length} records. Equal-revision differences were preserved as conflict copies.`,
      );
    } catch {
      setStatus("Import failed: select a valid AKB offline JSON export.");
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
      <form action={add} className="border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold">New local record</h2>
        <label className="mt-5 block text-sm">
          Type
          <select
            name="kind"
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          >
            <option value="collection">Saved collection</option>
            <option value="note">Local note</option>
            <option value="contact-draft">Contact draft</option>
          </select>
        </label>
        <label className="mt-4 block text-sm">
          Title
          <input
            name="title"
            required
            maxLength={160}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          />
        </label>
        <label className="mt-4 block text-sm">
          Public URL (optional)
          <input
            name="url"
            type="url"
            maxLength={1000}
            className="mt-2 min-h-11 w-full border border-border bg-background px-3"
          />
        </label>
        <label className="mt-4 block text-sm">
          Note or draft
          <textarea
            name="body"
            maxLength={10000}
            rows={7}
            className="mt-2 w-full border border-border bg-background p-3"
          />
        </label>
        <button
          type="submit"
          className="mt-5 inline-flex min-h-11 items-center gap-2 bg-foreground px-5 text-sm font-semibold text-background"
        >
          <Plus className="size-4" aria-hidden="true" />
          Save locally
        </button>
      </form>

      <section aria-labelledby="offline-records-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="offline-records-heading" className="text-xl font-semibold">
              Local workspace
            </h2>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportRecords}
              className="inline-flex min-h-11 items-center gap-2 border border-border px-4 text-sm"
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 border border-border px-4 text-sm"
            >
              <Upload className="size-4" aria-hidden="true" />
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importRecords(file);
              }}
            />
          </div>
        </div>
        <label className="mt-6 block text-sm">
          Search local records
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            className="mt-2 min-h-11 w-full border border-border bg-surface px-3"
          />
        </label>
        <ul className="mt-5 space-y-3">
          {filtered.map((record) => (
            <li key={record.id} className="border border-border p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted">
                    {record.kind}
                  </p>
                  <h3 className="mt-1 font-semibold">{record.title}</h3>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${record.title}`}
                  onClick={() =>
                    persist(records.filter((item) => item.id !== record.id))
                  }
                  className="size-11 p-3 text-muted hover:text-foreground"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              {record.body ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                  {record.body}
                </p>
              ) : null}
              {safePublicUrl(record.url) ? (
                <a
                  href={safePublicUrl(record.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-accent-warm underline"
                >
                  Open saved link
                </a>
              ) : null}
            </li>
          ))}
          {!filtered.length ? (
            <li className="border border-dashed border-border p-8 text-sm text-muted">
              No matching local records.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
