import Image from "next/image";
import Link from "next/link";

import { formatDiscipline, type PublishedContentRecord } from "../model";
import { EvidenceViewer } from "./evidence-viewer";
import { MarkdownDocument } from "./markdown-document";

type Props = {
  record: PublishedContentRecord;
  related: PublishedContentRecord[];
};

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function ContentDetail({ record, related }: Props) {
  const journal = record.kind === "journal";

  return (
    <main className="akb-reading">
      <header className="akb-reading__header">
        <div className="akb-reading__back">
          <Link href={journal ? "/journal" : "/knowledge"}>
            ← {journal ? "Engineering Journal" : "Knowledge Hub"}
          </Link>
          <span className="akb-folio">
            ENTRY / {record.id.slice(-6).toUpperCase()}
          </span>
        </div>

        <div className="akb-reading__meta">
          <span>{record.disciplines.map(formatDiscipline).join(" · ")}</span>
          <time dateTime={record.publishedAt}>
            {dateTime(record.publishedAt)}
          </time>
          <span>SOURCE · {record.source.label}</span>
          <span>
            {journal ? `${record.readingMinutes} MIN READ` : record.kind}
          </span>
        </div>

        <h1>{record.title}</h1>
        <p>{record.description}</p>

        {record.cover ? (
          <figure className="akb-reading__cover">
            <Image
              src={record.cover.src}
              alt={record.cover.alt}
              width={record.cover.width ?? 1600}
              height={record.cover.height ?? 800}
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            {record.cover.caption ? (
              <figcaption>{record.cover.caption}</figcaption>
            ) : null}
          </figure>
        ) : null}
      </header>

      <div className="akb-reading__body">
        <article className="akb-manuscript">
          <span className="akb-manuscript__folio" aria-hidden="true">
            {journal ? "FIELD NOTE" : "RESEARCH FOLIO"}
          </span>
          <MarkdownDocument markdown={record.body} />
          <EvidenceViewer attachments={record.attachments} />

          {related.length > 0 ? (
            <section className="akb-related-route" aria-labelledby="related">
              <span className="akb-folio">CONTINUE THE ROUTE</span>
              <h2 id="related">Related work</h2>
              {related.map((item, index) => (
                <Link href={item.canonicalPath} key={item.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.disciplines.map(formatDiscipline).join(" · ")}
                  </small>
                </Link>
              ))}
            </section>
          ) : null}
        </article>

        <aside className="akb-reading__margin" aria-label="Publication context">
          <section className="akb-context-note">
            <span className="akb-folio">CONTEXT / SOURCE</span>
            <dl>
              <div>
                <dt>Source</dt>
                <dd>{record.source.label}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{dateTime(record.publishedAt)}</dd>
              </div>
              {record.updatedAt ? (
                <div>
                  <dt>Updated</dt>
                  <dd>{dateTime(record.updatedAt)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Topics</dt>
                <dd>{record.topics.join(" · ") || "—"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
