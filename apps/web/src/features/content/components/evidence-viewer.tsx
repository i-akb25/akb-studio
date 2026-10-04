"use client";

import { useEffect, useState } from "react";
import type { ContentAttachment } from "../model";

type EvidenceViewerProps = { attachments: ContentAttachment[] };

function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

function attachmentUrl(attachment: ContentAttachment): string | undefined {
  if (attachment.storage === "google-drive" && attachment.fileId) {
    return `https://drive.google.com/file/d/${encodeURIComponent(attachment.fileId)}/view`;
  }
  return attachment.url;
}

export function EvidenceViewer({ attachments }: EvidenceViewerProps) {
  const [active, setActive] = useState<ContentAttachment | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);

  if (!attachments.length) return null;

  return (
    <section className="akb-evidence" aria-labelledby="evidence-title">
      <p className="akb-kicker">Evidence</p>
      <h2 id="evidence-title">Supporting material</h2>
      <div className="akb-evidence__grid">
        {attachments.map((attachment) => (
          <button
            type="button"
            key={attachment.id}
            onClick={() => setActive(attachment)}
            className="akb-evidence__item"
          >
            <span>{attachment.kind}</span>
            <span>
              <strong>{attachment.title}</strong>
              {attachment.description ? (
                <small className="mt-1 block text-muted">
                  {attachment.description}
                </small>
              ) : null}
            </span>
          </button>
        ))}
      </div>
      {active ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/78"
            aria-label="Close viewer"
            onClick={() => setActive(null)}
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/15 bg-background shadow-2xl">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-lg font-semibold">{active.title}</h2>
              <div className="flex items-center gap-4">
                {attachmentUrl(active) ? (
                  <a
                    href={attachmentUrl(active)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline underline-offset-4"
                  >
                    Open in new tab
                  </a>
                ) : null}
                <button
                  type="button"
                  className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
                  onClick={() => setActive(null)}
                >
                  Close
                </button>
              </div>
            </header>
            <div className="min-h-[65vh] flex-1 bg-white">
              {active.storage === "google-drive" && active.fileId ? (
                <iframe
                  src={drivePreviewUrl(active.fileId)}
                  title={active.title}
                  allow="autoplay"
                  referrerPolicy="no-referrer"
                  className="h-[78vh] w-full border-0"
                />
              ) : active.url ? (
                <iframe
                  src={active.url}
                  title={active.title}
                  referrerPolicy="no-referrer"
                  className="h-[78vh] w-full border-0"
                />
              ) : (
                <div className="grid h-[65vh] place-items-center p-8 text-center text-black/70">
                  This attachment does not have a public-safe viewer source yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
