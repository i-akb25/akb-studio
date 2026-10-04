"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  FEATURE_RELATIONSHIPS,
  FEATURE_SOURCES,
  FEATURE_TYPES,
  type FeatureItem,
  featureSourceLabel,
} from "@/features/pravaah/model";

type PravaahConsoleProps = {
  items: readonly FeatureItem[];
  discoveries: readonly FeatureItem[];
  anonymousNoteConfigured: boolean;
};

export function PravaahConsole({
  items,
  discoveries,
  anonymousNoteConfigured,
}: PravaahConsoleProps) {
  const router = useRouter();
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setResult("");

    const formData = new FormData(form);
    const publishedAt = formData.get("publishedAt");
    if (typeof publishedAt === "string" && publishedAt) {
      formData.set("publishedAt", new Date(publishedAt).toISOString());
    }

    try {
      const response = await fetch("/api/admin/pravaah", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.error ?? "The Pravaah update failed.");
      setResult("Pravaah registry updated.");
      form.reset();
      router.refresh();
    } catch (error) {
      setResult(
        error instanceof Error ? error.message : "The Pravaah update failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="akb-admin-page pravaah-admin">
      <header className="akb-admin-page__header">
        <p className="akb-kicker">PRAVAAH / CURATION</p>
        <h1>Public signal control</h1>
        <p>
          Review automatic GitHub discoveries, add external posts and control
          what becomes public. Every change is written to the private knowledge
          repository before it appears on the public Pravaah page.
        </p>
      </header>

      <div className="akb-admin-guide">
        <strong>How this page works</strong>
        <p>
          Feature publishes a discovered public repository. Ignore removes it
          from this inbox. The manual form is for reviewed external posts and
          AKB Studio announcements. A failed save changes nothing publicly.
        </p>
      </div>

      <section
        className="akb-admin-panel"
        aria-labelledby="pravaah-inbox-title"
      >
        <div className="akb-margin-rule">
          <span>INBOX</span>
          <span>{discoveries.length} PENDING</span>
        </div>
        <h2 id="pravaah-inbox-title">GitHub discoveries</h2>
        {discoveries.length ? (
          <div className="akb-admin-list">
            {discoveries.map((item) => (
              <article key={item.id}>
                <div>
                  <p className="akb-kicker">
                    {featureSourceLabel(item.source, item.sourceName)}
                  </p>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </div>
                <form onSubmit={submit}>
                  <input
                    type="hidden"
                    name="externalId"
                    value={item.externalId}
                  />
                  <button
                    type="submit"
                    name="action"
                    value="feature-github"
                    disabled={busy}
                  >
                    Feature
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="ignore-github"
                    disabled={busy}
                  >
                    Ignore
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p>No unreviewed GitHub discoveries are available.</p>
        )}
      </section>

      <section
        className="akb-admin-panel"
        aria-labelledby="pravaah-manual-title"
      >
        <div className="akb-margin-rule">
          <span>MANUAL ADAPTER</span>
          <span>REVIEWED LINKS ONLY</span>
        </div>
        <h2 id="pravaah-manual-title">Add a post or announcement</h2>
        <form className="akb-admin-form" onSubmit={submit}>
          <input type="hidden" name="action" value="publish-manual" />
          <div className="akb-admin-grid">
            <label>
              <span>Source</span>
              <select name="source" defaultValue="linkedin">
                {FEATURE_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {featureSourceLabel(source)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Other source name</span>
              <input
                name="sourceName"
                placeholder="Dev.to, Substack, Mastodon…"
              />
            </label>
            <label>
              <span>Written by</span>
              <input
                name="author"
                defaultValue="Anurag Kumar Bharti"
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label>
              <span>Relationship</span>
              <select name="relationship" defaultValue="by-akb">
                {FEATURE_RELATIONSHIPS.map((relationship) => (
                  <option key={relationship} value={relationship}>
                    {relationship === "by-akb"
                      ? "Published by me"
                      : relationship === "about-akb"
                        ? "Written about me"
                        : "AKB Studio announcement"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Type</span>
              <select name="type" defaultValue="post">
                {FEATURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="akb-admin-span-2">
              <span>Title</span>
              <input name="title" minLength={3} maxLength={180} required />
            </label>
            <label className="akb-admin-span-2">
              <span>Excerpt</span>
              <textarea
                name="excerpt"
                minLength={10}
                maxLength={700}
                required
              />
            </label>
            <label className="akb-admin-span-2">
              <span>Canonical HTTPS URL</span>
              <input name="canonicalUrl" type="url" inputMode="url" />
            </label>
            <label>
              <span>Approved local media path</span>
              <input name="mediaSrc" placeholder="/images/pravaah/item.webp" />
            </label>
            <label>
              <span>Media alternative text</span>
              <input name="mediaAlt" maxLength={240} />
            </label>
            <label>
              <span>Publish state</span>
              <select name="status" defaultValue="published">
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </label>
            <label>
              <span>Publish time</span>
              <input name="publishedAt" type="datetime-local" />
            </label>
            <label>
              <span>Priority, 0–100</span>
              <input
                name="priority"
                type="number"
                min="0"
                max="100"
                defaultValue="0"
              />
            </label>
            <label>
              <span>Tags</span>
              <input name="tags" placeholder="release,codevet" />
            </label>
            <label className="akb-check-row">
              <input name="pinned" type="checkbox" />
              <span>Pin as current signal</span>
            </label>
          </div>
          <div className="akb-admin-actions">
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Publish to Pravaah"}
            </button>
          </div>
        </form>
      </section>

      <section className="akb-admin-panel" aria-labelledby="pravaah-live-title">
        <div className="akb-margin-rule">
          <span>REGISTRY</span>
          <span>{items.length} ITEMS</span>
        </div>
        <h2 id="pravaah-live-title">Published and retained items</h2>
        <div className="akb-admin-list">
          {items.map((item) => (
            <article key={item.id}>
              <div>
                <p className="akb-kicker">
                  {featureSourceLabel(item.source, item.sourceName)} /{" "}
                  {item.status}
                </p>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </div>
              <form onSubmit={submit}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="pinned"
                  value={String(!item.pinned)}
                />
                <button
                  type="submit"
                  name="action"
                  value="toggle-pin"
                  disabled={busy}
                >
                  {item.pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  type="submit"
                  name="action"
                  value="hide"
                  disabled={busy}
                >
                  Hide
                </button>
                <button
                  type="submit"
                  name="action"
                  value="archive"
                  disabled={busy}
                >
                  Archive
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <aside className="akb-admin-panel">
        <p className="akb-kicker">EXTERNAL NOTE</p>
        <p>
          {anonymousNoteConfigured
            ? "Anonymous-note destination is configured."
            : "Set AKB_ANONYMOUS_NOTE_URL to show the external anonymous-note link."}
        </p>
      </aside>

      <output className="akb-admin-status" aria-live="polite">
        {result}
      </output>
    </div>
  );
}
