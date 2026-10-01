"use client";

import { useEffect, useState } from "react";
import type { ContentAttachment } from "../model";

type EvidenceViewerProps = { attachments: ContentAttachment[] };

function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
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
          >
            <span>{attachment.kind}</span>
            <strong>{attachment.title}</strong>
          </button>
        ))}
      </div>
      {active ? (
        <div
          className="akb-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <button
            type="button"
            className="akb-viewer__backdrop"
            aria-label="Close viewer"
            onClick={() => setActive(null)}
          />
          <div className="akb-viewer__panel">
            <header>
              <h2>{active.title}</h2>
              <button type="button" onClick={() => setActive(null)}>
                Close
              </button>
            </header>
            <div className="akb-viewer__body">
              {active.storage === "google-drive" && active.fileId ? (
                <iframe
                  src={drivePreviewUrl(active.fileId)}
                  title={active.title}
                  allow="autoplay"
                  referrerPolicy="no-referrer"
                />
              ) : active.url ? (
                <iframe
                  src={active.url}
                  title={active.title}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="akb-viewer__unavailable">
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
