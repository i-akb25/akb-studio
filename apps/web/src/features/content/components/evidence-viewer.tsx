"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentAttachment } from "../model";

type EvidenceViewerProps = { attachments: ContentAttachment[] };

function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

function attachmentUrl(attachment: ContentAttachment): string | undefined {
  if (attachment.storage === "google-drive" && attachment.fileId) {
    return `https://drive.google.com/file/d/${encodeURIComponent(attachment.fileId)}/view`;
  }
  if (!attachment.url) return undefined;
  try {
    const url = new URL(attachment.url, "https://akb.invalid");
    if (url.protocol !== "https:" || url.username || url.password)
      return undefined;
    return attachment.url;
  } catch {
    return undefined;
  }
}

export function attachmentPreviewUrl(
  attachment: ContentAttachment,
): string | undefined {
  if (attachment.storage === "google-drive" && attachment.fileId)
    return drivePreviewUrl(attachment.fileId);
  const href = attachmentUrl(attachment);
  if (!href) return undefined;
  const url = new URL(href, "https://akb.invalid");
  return url.origin === "https://akb.invalid" ||
    url.hostname === "res.cloudinary.com"
    ? href
    : undefined;
}

export function EvidenceViewer({ attachments }: EvidenceViewerProps) {
  const [active, setActive] = useState<ContentAttachment | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
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
            <span className="akb-evidence__kind">{attachment.kind}</span>
            <span className="akb-evidence__copy">
              <strong className="akb-evidence__title">
                {attachment.title}
              </strong>
              {attachment.description ? (
                <small className="mt-1 block text-muted">
                  {attachment.description}
                </small>
              ) : null}
            </span>
            <span className="akb-evidence__action" aria-hidden="true">
              Open preview ↗
            </span>
          </button>
        ))}
      </div>
      {active ? (
        <dialog
          ref={dialogRef}
          onCancel={() => setActive(null)}
          className="fixed inset-0 z-[100] m-0 h-full max-h-none w-full max-w-none place-items-center bg-transparent p-4 open:grid sm:p-8"
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
              {attachmentPreviewUrl(active) ? (
                <iframe
                  src={attachmentPreviewUrl(active)}
                  title={active.title}
                  referrerPolicy="no-referrer"
                  className="h-[78vh] w-full border-0"
                />
              ) : (
                <div className="grid h-[65vh] place-items-center p-8 text-center text-black/70">
                  {attachmentUrl(active)
                    ? "This source does not support an embedded preview here. Use Open in new tab."
                    : "This attachment does not have a public-safe viewer source yet."}
                </div>
              )}
            </div>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}
