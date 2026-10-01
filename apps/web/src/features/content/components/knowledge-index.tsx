import Link from "next/link";

import { SubscribePanel } from "@/features/notifications/components/subscribe-panel";
import {
  type PublicThread,
  VartalapPanel,
} from "@/features/vartalap/components/vartalap-panel";

import {
  CONTENT_DISCIPLINES,
  formatDiscipline,
  KNOWLEDGE_KINDS,
  type KnowledgeKind,
  type KnowledgeSummary,
} from "../model";

type Props = {
  records: KnowledgeSummary[];
  query: string;
  discipline: string;
  knowledgeKind: string;
  threads: PublicThread[];
};

function publishedDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function kindLabel(kind: KnowledgeKind): string {
  if (kind === "note") return "Technical note";
  if (kind === "research") return "Research note";
  if (kind === "reading") return "Reading note";
  if (kind === "roadmap") return "Roadmap";
  return "Reflection";
}

export function KnowledgeIndex({
  records,
  query,
  discipline,
  knowledgeKind,
  threads,
}: Props) {
  const hasPublishedKnowledge = records.length > 0;
  const filtersActive = Boolean(query || discipline || knowledgeKind);
  const disciplines = discipline
    ? CONTENT_DISCIPLINES.filter((item) => item === discipline)
    : CONTENT_DISCIPLINES;

  return (
    <main className="akb-knowledge-page">
      <header className="akb-knowledge-hero">
        <div className="akb-knowledge-hero__title">
          <span className="akb-knowledge-folio">RESEARCH FOLIO / 08</span>
          <h1>Knowledge Hub</h1>
        </div>
        <div className="akb-knowledge-hero__context">
          <p>
            Structured notes, research, reading and engineering routes kept as
            an index of accumulated knowledge rather than a feed.
          </p>
          <dl>
            <div>
              <dt>Form</dt>
              <dd>Technical folio</dd>
            </div>
            <div>
              <dt>Navigation</dt>
              <dd>Discipline → subject → entry</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>Reviewed publications only</dd>
            </div>
          </dl>
        </div>
      </header>

      <section
        className="akb-knowledge-register"
        aria-labelledby="knowledge-index-title"
      >
        <header className="akb-knowledge-register__intro">
          <div>
            <span className="akb-knowledge-folio">INDEX / DISCIPLINES</span>
            <h2 id="knowledge-index-title">
              A technical index built for retrieval.
            </h2>
          </div>
          <p>
            Start with a discipline, narrow through subjects, then open the
            reviewed entry. No feed ranking, no fabricated catalogue.
          </p>
        </header>

        <form className="akb-content-filters" action="/knowledge" method="get">
          <label>
            <span>Search Knowledge</span>
            <input
              name="q"
              type="search"
              defaultValue={query}
              maxLength={120}
              placeholder="Topic, source, tag…"
            />
          </label>
          <label>
            <span>Discipline</span>
            <select name="discipline" defaultValue={discipline}>
              <option value="">All disciplines</option>
              {CONTENT_DISCIPLINES.map((item) => (
                <option key={item} value={item}>
                  {formatDiscipline(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Kind</span>
            <select name="kind" defaultValue={knowledgeKind}>
              <option value="">All kinds</option>
              {KNOWLEDGE_KINDS.map((item) => (
                <option key={item} value={item}>
                  {kindLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Apply filters</button>
          {filtersActive ? <Link href="/knowledge">Clear</Link> : null}
        </form>

        <div className="akb-knowledge-register__body">
          {disciplines.map((item, index) => {
            const disciplineRecords = records.filter((record) =>
              record.disciplines.includes(item),
            );
            const topics = Array.from(
              new Set(disciplineRecords.flatMap((record) => record.topics)),
            ).slice(0, 6);
            return (
              <section className="akb-knowledge-discipline" key={item}>
                <div className="akb-knowledge-discipline__identity">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{formatDiscipline(item)}</h3>
                </div>
                <div className="akb-knowledge-discipline__content">
                  {disciplineRecords.length > 0 ? (
                    <>
                      {topics.length > 0 ? (
                        <div className="akb-knowledge-topics">
                          <span className="akb-visually-hidden">
                            {formatDiscipline(item)} subjects:
                          </span>
                          {topics.map((topic) => (
                            <span key={topic}>{topic}</span>
                          ))}
                        </div>
                      ) : null}
                      <div className="akb-knowledge-entries">
                        {disciplineRecords.map((record) => (
                          <Link
                            key={record.id}
                            href={record.canonicalPath}
                            className="akb-knowledge-entry"
                          >
                            <span className="akb-knowledge-entry__kind">
                              {kindLabel(record.kind)}
                            </span>
                            <strong>{record.title}</strong>
                            <small>
                              {record.topics.slice(0, 2).join(" · ") ||
                                record.source.label}
                            </small>
                            <time dateTime={record.publishedAt}>
                              {publishedDate(record.publishedAt)}
                            </time>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="akb-knowledge-discipline__empty">
                      No published entries yet.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {!hasPublishedKnowledge ? (
          <aside
            className="akb-knowledge-empty"
            aria-label="Knowledge publication state"
          >
            <span className="akb-knowledge-folio">
              {filtersActive
                ? "FILTER STATE / EMPTY"
                : "PUBLICATION STATE / READY"}
            </span>
            <div>
              <h3>
                {filtersActive
                  ? "No reviewed knowledge matches these filters."
                  : "The index is ready. The knowledge stays private until it is reviewed."}
              </h3>
              <p>
                {filtersActive
                  ? "Clear or change the search to return to the complete technical index."
                  : "Notes, research, reading trails and roadmaps will appear here only after editorial review and explicit publication."}
              </p>
            </div>
          </aside>
        ) : null}
      </section>

      <section
        className="akb-content-index-vartalap"
        aria-label="Knowledge Vartalap"
      >
        <VartalapPanel
          contentId="knowledge:index"
          contentType="knowledge"
          contentSlug="knowledge-index"
          contextLabel="the Knowledge Hub"
          threads={threads}
        />
      </section>
      <div className="akb-knowledge-subscription">
        <SubscribePanel />
      </div>
    </main>
  );
}
