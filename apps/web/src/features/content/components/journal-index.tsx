import Link from "next/link";

import { SubscribePanel } from "@/features/notifications/components/subscribe-panel";
import {
  type PublicThread,
  VartalapPanel,
} from "@/features/vartalap/components/vartalap-panel";

import {
  CONTENT_DISCIPLINES,
  formatDiscipline,
  type JournalSummary,
} from "../model";

type Props = {
  records: JournalSummary[];
  query: string;
  discipline: string;
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

export function JournalIndex({ records, query, discipline, threads }: Props) {
  const filtersActive = Boolean(query || discipline);

  return (
    <main className="akb-journal-page">
      <header className="akb-journal-hero">
        <div className="akb-journal-hero__title">
          <span className="akb-journal-folio">FIELD PUBLICATION / 08</span>
          <h1>Engineering Journal</h1>
        </div>

        <div className="akb-journal-hero__context">
          <p>
            Decisions, investigations, failures, experiments and lessons
            recorded after the work, not around it.
          </p>
          <dl>
            <div>
              <dt>Form</dt>
              <dd>Chronological field notes</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>Engineering practice</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>Bettiah · India</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>Reviewed publications only</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="akb-journal-log" aria-labelledby="journal-log-title">
        <header className="akb-journal-log__intro">
          <div>
            <span className="akb-journal-folio">PUBLICATION LOG</span>
            <h2 id="journal-log-title">
              Newest reviewed field notes appear first.
            </h2>
          </div>
          <p>
            Draft material stays private until it is useful enough to release.
            Search the reviewed record by subject or discipline.
          </p>
        </header>

        <form className="akb-content-filters" action="/journal" method="get">
          <label>
            <span>Search Journal</span>
            <input
              name="q"
              type="search"
              defaultValue={query}
              maxLength={120}
              placeholder="Decision, experiment, topic…"
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
          <button type="submit">Apply filters</button>
          {filtersActive ? <Link href="/journal">Clear</Link> : null}
        </form>

        {records.length === 0 ? (
          <div className="akb-journal-empty">
            <div className="akb-journal-empty__marker" aria-hidden="true">
              <span>01</span>
              <i />
            </div>
            <div className="akb-journal-empty__copy">
              <span className="akb-journal-folio">
                {filtersActive ? "NO MATCH" : "AWAITING RELEASE"}
              </span>
              <h3>
                {filtersActive
                  ? "No reviewed field notes match these filters."
                  : "No reviewed field notes released yet."}
              </h3>
              <p>
                {filtersActive
                  ? "Clear or change the search to continue through the publication route."
                  : "Draft material remains private until editorial review and explicit publication. The first approved entry will begin the route here."}
              </p>
            </div>
          </div>
        ) : (
          <ol className="akb-journal-entries">
            {records.map((record, index) => (
              <li key={record.id}>
                <article className="akb-journal-entry">
                  <div className="akb-journal-entry__number">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="akb-journal-entry__meta">
                    <time dateTime={record.publishedAt}>
                      {publishedDate(record.publishedAt)}
                    </time>
                    <span>{record.readingMinutes} MIN</span>
                    <span>{record.source.label}</span>
                  </div>
                  <div className="akb-journal-entry__main">
                    <h3>
                      <Link
                        className="akb-journal-entry__link"
                        href={record.canonicalPath}
                      >
                        {record.title}
                      </Link>
                    </h3>
                    <p>{record.description}</p>
                    <div className="akb-journal-entry__terms">
                      {record.disciplines.map((item) => (
                        <span key={item}>{formatDiscipline(item)}</span>
                      ))}
                      {record.topics.slice(0, 3).map((topic) => (
                        <span key={topic}>{topic}</span>
                      ))}
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        className="akb-content-index-vartalap"
        aria-label="Journal Vartalap"
      >
        <VartalapPanel
          contentId="journal:index"
          contentType="journal"
          contentSlug="journal-index"
          contextLabel="the Engineering Journal"
          threads={threads}
        />
      </section>
      <div className="akb-journal-subscription">
        <SubscribePanel />
      </div>
    </main>
  );
}
