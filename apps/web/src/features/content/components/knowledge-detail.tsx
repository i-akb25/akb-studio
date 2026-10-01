import Image from "next/image";
import Link from "next/link";

import {
  type PublicThread,
  VartalapPanel,
} from "@/features/vartalap/components/vartalap-panel";

import {
  formatDiscipline,
  type KnowledgeRecord,
  type PublishedContentSummary,
} from "../model";
import { EvidenceViewer } from "./evidence-viewer";
import { MarkdownDocument } from "./markdown-document";

type Props = {
  record: KnowledgeRecord;
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

function kindLabel(kind: KnowledgeRecord["kind"]): string {
  if (kind === "note") return "TECHNICAL NOTE";
  if (kind === "research") return "RESEARCH NOTE";
  if (kind === "reading") return "READING NOTE";
  if (kind === "roadmap") return "ROADMAP";
  return "REFLECTION";
}

export function KnowledgeDetail({ record, related, threads }: Props) {
  return (
    <main className="akb-knowledge-reading">
      <header className="akb-knowledge-reading__header">
        <div className="akb-knowledge-reading__eyebrow">
          <Link href="/knowledge">← Knowledge Hub</Link>
          <span className="akb-knowledge-folio">
            ENTRY / {record.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="akb-knowledge-reading__meta">
          <span>{record.disciplines.map(formatDiscipline).join(" · ")}</span>
          <span>{kindLabel(record.kind)}</span>
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
        </div>

        <h1>{record.title}</h1>
        <p>{record.description}</p>

        {record.cover ? (
          <figure className="akb-knowledge-reading__cover">
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

      <div className="akb-knowledge-reading__layout">
        <article className="akb-knowledge-manuscript">
          <span className="akb-knowledge-manuscript__label" aria-hidden="true">
            RESEARCH FOLIO
          </span>

          <MarkdownDocument markdown={record.body} />
          <EvidenceViewer attachments={record.attachments} />

          {related.length > 0 ? (
            <section
              className="akb-knowledge-related"
              aria-labelledby="knowledge-related-title"
            >
              <span className="akb-knowledge-folio">CONTINUE THE ROUTE</span>
              <h2 id="knowledge-related-title">Related knowledge</h2>
              <div className="akb-knowledge-related__list">
                {related.map((item, index) => (
                  <Link
                    className="akb-knowledge-related__link"
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

        <div className="akb-knowledge-margin">
          <VartalapPanel
            contentId={record.id}
            contentType="knowledge"
            contentSlug={record.slug}
            threads={threads}
          />

          <section
            className="akb-knowledge-context"
            aria-labelledby="knowledge-context-title"
          >
            <span className="akb-knowledge-folio">PUBLICATION CONTEXT</span>
            <h2 id="knowledge-context-title">Research margin</h2>
            <dl>
              <div>
                <dt>Kind</dt>
                <dd>{kindLabel(record.kind)}</dd>
              </div>
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
