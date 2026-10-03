"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type Preview = {
  title: string;
  description: string;
  kind: string;
  source: string;
  sourceUrl: string;
  body: string;
};

export function ContentConsole() {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  function buildPreview(form: HTMLFormElement) {
    const data = new FormData(form);
    setPreview({
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      kind: String(data.get("kind") ?? "journal"),
      source: String(data.get("sourceLabel") ?? ""),
      sourceUrl: String(data.get("sourceUrl") ?? ""),
      body: String(data.get("markdown") ?? ""),
    });
    setResult("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!preview) {
      buildPreview(form);
      return;
    }

    setBusy(true);
    setResult("");

    try {
      const response = await fetch("/api/admin/content/publish", {
        method: "POST",
        body: new FormData(form),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        canonicalPath?: string;
      } | null;
      if (!response.ok) throw new Error(data?.error ?? "Publication failed.");

      setResult(`Published: ${data?.canonicalPath ?? "content updated"}`);
      setPreview(null);
      form.reset();
      router.refresh();
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Publication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="akb-admin-publisher">
      <form
        className="akb-admin-form"
        onSubmit={submit}
        onChange={() => preview && setPreview(null)}
      >
        <div className="akb-admin-grid">
          <label>
            <span>Type</span>
            <select name="kind" defaultValue="journal">
              <option value="journal">Engineering Journal</option>
              <option value="knowledge">Knowledge Hub</option>
            </select>
          </label>

          <label>
            <span>Knowledge subtype</span>
            <select name="knowledgeKind" defaultValue="note">
              <option value="note">Note</option>
              <option value="research">Research</option>
              <option value="reading">Reading</option>
              <option value="roadmap">Roadmap</option>
              <option value="reflection">Reflection</option>
            </select>
          </label>

          <label>
            <span>Title</span>
            <input name="title" maxLength={180} required />
          </label>

          <label>
            <span>Slug</span>
            <input name="slug" pattern="[a-z0-9-]{2,160}" required />
          </label>

          <label className="akb-admin-span-2">
            <span>Description</span>
            <textarea name="description" maxLength={500} required />
          </label>

          <label>
            <span>Disciplines</span>
            <input name="disciplines" placeholder="software,ai" required />
          </label>

          <label>
            <span>Source label</span>
            <input
              name="sourceLabel"
              placeholder="AKB Studio field note"
              required
            />
          </label>

          <label>
            <span>Source type</span>
            <select name="sourceType" defaultValue="original">
              <option value="original">Original</option>
              <option value="project">Project</option>
              <option value="paper">Paper</option>
              <option value="book">Book</option>
              <option value="documentation">Documentation</option>
              <option value="dataset">Dataset</option>
              <option value="website">Website / LinkedIn</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>

          <label className="akb-admin-span-2">
            <span>Canonical source URL (optional)</span>
            <input
              type="url"
              name="sourceUrl"
              inputMode="url"
              placeholder="https://www.linkedin.com/posts/..."
            />
          </label>

          <label>
            <span>Topics</span>
            <input name="topics" placeholder="security,architecture" />
          </label>

          <label>
            <span>Tags</span>
            <input name="tags" placeholder="postmortem,decision" />
          </label>

          <label className="akb-admin-span-2">
            <span>Upload .md, .txt or .docx</span>
            <input type="file" name="document" accept=".md,.txt,.docx" />
          </label>

          <label className="akb-admin-span-2">
            <span>Or paste Markdown / text</span>
            <textarea className="akb-admin-editor" name="markdown" />
          </label>

          <label className="akb-admin-span-2">
            <span>Evidence JSON</span>
            <textarea
              name="attachments"
              placeholder='[{"id":"pdf-01","kind":"pdf","title":"Report","storage":"google-drive","fileId":"..."}]'
            />
          </label>

          <label className="akb-check-row">
            <input
              type="checkbox"
              name="notificationRequested"
              defaultChecked
            />
            <span>Send publication notification</span>
          </label>

          <label>
            <span>Optional notification time</span>
            <input type="datetime-local" name="scheduledAt" />
          </label>
        </div>

        <div className="akb-admin-actions">
          <button type="submit" disabled={busy}>
            {busy ? "Publishing…" : preview ? "Confirm publish" : "Preview"}
          </button>
        </div>

        <output aria-live="polite">{result}</output>
      </form>

      {preview ? (
        <aside className="akb-admin-preview" aria-label="Publication preview">
          <div className="akb-margin-rule">
            <span>PREVIEW</span>
            <span>NOT YET PUBLIC</span>
          </div>
          <p className="akb-kicker">{preview.kind}</p>
          <h2>{preview.title || "Untitled"}</h2>
          <p>{preview.description}</p>
          <dl>
            <div>
              <dt>Source</dt>
              <dd>{preview.source || "—"}</dd>
            </div>
            {preview.sourceUrl ? (
              <div>
                <dt>Canonical URL</dt>
                <dd>{preview.sourceUrl}</dd>
              </div>
            ) : null}
          </dl>
          <pre>
            {preview.body || "Uploaded document will be parsed on publish."}
          </pre>
        </aside>
      ) : null}
    </div>
  );
}
