import Image from "next/image";
import Link from "next/link";

import {
  type PublicThread,
  VartalapPanel,
} from "@/features/vartalap/components/vartalap-panel";

import {
  formatDiscipline,
  type JournalRecord,
  type PublishedContentSummary,
} from "../model";
import { EvidenceViewer } from "./evidence-viewer";
import { MarkdownDocument } from "./markdown-document";

type Props = {
  record: JournalRecord;
  related: PublishedContentSummary[];
  threads: PublicThread[];
};

function publicationDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function publicationTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function JournalDetail({ record, related, threads }: Props) {
  return (
    <main className="akb-journal-reading">
      <header className="akb-journal-reading__header">
        <div className="akb-journal-reading__eyebrow">
          <Link className="akb-journal-reading__back" href="/journal">
            ← Engineering Journal
          </Link>
          <span className="akb-journal-folio">
            ENTRY / {record.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="akb-journal-reading__meta">
          <span>{record.disciplines.map(formatDiscipline).join(" · ")}</span>
          <time dateTime={record.publishedAt}>
            {publicationDate(record.publishedAt)} ·{" "}
            {publicationTime(record.publishedAt)}
          </time>
          <span>
            SOURCE ·{" "}
            {record.source.url ? (
              <a href={record.source.url} rel="noreferrer" target="_blank">
                {record.source.label}
              </a>
            ) : (
              record.source.label
            )}
          </span>
          <span>{record.readingMinutes} MIN READ</span>
        </div>

        <h1>{record.title}</h1>
        <p>{record.description}</p>

        {record.cover ? (
          <figure className="akb-journal-reading__cover">
            <Image
              src={record.cover.src}
              alt={record.cover.alt}
              width={record.cover.width ?? 1600}
              height={record.cover.height ?? 900}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            {record.cover.caption ? (
              <figcaption>{record.cover.caption}</figcaption>
            ) : null}
          </figure>
        ) : null}
      </header>

      <div className="akb-journal-reading__layout">
        <article className="akb-journal-manuscript">
          <span className="akb-journal-manuscript__label" aria-hidden="true">
            FIELD NOTE
          </span>

          <MarkdownDocument markdown={record.body} />
          <EvidenceViewer attachments={record.attachments} />

          {related.length > 0 ? (
            <section
              className="akb-journal-related"
              aria-labelledby="journal-related-title"
            >
              <span className="akb-journal-folio">CONTINUE THE ROUTE</span>
              <h2 id="journal-related-title">Related work</h2>
              <div className="akb-journal-related__list">
                {related.map((item, index) => (
                  <Link
                    className="akb-journal-related__link"
                    href={item.canonicalPath}
                    key={item.id}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.disciplines.map(formatDiscipline).join(" · ")}
                    </small>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <div className="akb-journal-margin">
          <VartalapPanel
            contentId={record.id}
            contentType="journal"
            contentSlug={record.slug}
            threads={threads}
          />

          <section
            className="akb-journal-context"
            aria-labelledby="journal-context-title"
          >
            <span className="akb-journal-folio">PUBLICATION CONTEXT</span>
            <h2 id="journal-context-title">Field margin</h2>
            <dl>
              <div>
                <dt>Source</dt>
                <dd>
                  {record.source.url ? (
                    <a
                      href={record.source.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {record.source.label}
                    </a>
                  ) : (
                    record.source.label
                  )}
                </dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{publicationDate(record.publishedAt)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{publicationTime(record.publishedAt)}</dd>
              </div>
              <div>
                <dt>Reading time</dt>
                <dd>{record.readingMinutes} minutes</dd>
              </div>
              {record.updatedAt ? (
                <div>
                  <dt>Updated</dt>
                  <dd>{publicationDate(record.updatedAt)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Topics</dt>
                <dd>{record.topics.join(" · ") || "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
