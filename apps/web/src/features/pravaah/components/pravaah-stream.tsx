"use client";

import {
  ArrowUpRight,
  AtSign,
  Megaphone,
  Newspaper,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { FeatureItem, FeatureSource } from "@/features/pravaah/model";
import { featureSourceLabel } from "@/features/pravaah/model";

type PravaahStreamProps = {
  items: readonly FeatureItem[];
};

type SignalFilter =
  | "all"
  | "by-akb"
  | "about-akb"
  | "linkedin"
  | "instagram"
  | "x"
  | "github"
  | "publications"
  | "announcement";

const PAGE_SIZE = 12;

const FILTERS: readonly { value: SignalFilter; label: string }[] = [
  { value: "all", label: "All signals" },
  { value: "by-akb", label: "Published by me" },
  { value: "about-akb", label: "Written about me" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X" },
  { value: "github", label: "GitHub" },
  { value: "publications", label: "Publications" },
  { value: "announcement", label: "Announcements" },
];

function SourceIcon({ source }: { source: FeatureSource }) {
  if (source === "github") {
    return (
      <span className="pravaah-source-mark" aria-hidden="true">
        GH
      </span>
    );
  }
  if (source === "linkedin") {
    return (
      <span className="pravaah-source-mark" aria-hidden="true">
        IN
      </span>
    );
  }
  if (source === "instagram") {
    return (
      <span className="pravaah-source-mark" aria-hidden="true">
        IG
      </span>
    );
  }
  if (source === "announcement") return <Megaphone aria-hidden="true" />;
  if (source === "x") return <AtSign aria-hidden="true" />;
  if (source === "medium" || source === "quora" || source === "reddit") {
    return <Newspaper aria-hidden="true" />;
  }
  return <ArrowUpRight aria-hidden="true" />;
}

function formatDate(value: string | undefined): string {
  if (!value) return "Undated";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function matchesFilter(item: FeatureItem, filter: SignalFilter): boolean {
  if (filter === "all") return true;
  if (filter === "linkedin") return item.source === "linkedin";
  if (filter === "instagram") return item.source === "instagram";
  if (filter === "x") return item.source === "x";
  if (filter === "github") return item.source === "github";
  if (filter === "publications") {
    return ["medium", "quora", "reddit", "other"].includes(item.source);
  }
  if (filter === "announcement") return item.type === "announcement";
  return item.relationship === filter;
}

export function PravaahStream({ items }: PravaahStreamProps) {
  const [filter, setFilter] = useState<SignalFilter>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (!matchesFilter(item, filter)) return false;
    if (!normalizedQuery) return true;

    return [
      item.title,
      item.excerpt,
      item.author,
      featureSourceLabel(item.source, item.sourceName),
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
  const visibleItems = filteredItems.slice(0, visibleCount);

  return (
    <section
      className="pravaah-archive"
      aria-labelledby="pravaah-archive-title"
    >
      <header className="pravaah-archive__header">
        <div>
          <p className="pravaah-kicker">THE SIGNAL ARCHIVE</p>
          <h2 id="pravaah-archive-title">
            Everything shared.
            <span className="pravaah-archive__accent">
              Nothing lost in the scroll.
            </span>
          </h2>
        </div>
        <p>
          Public posts, releases, announcements and independent coverage,
          collected without copying the surrounding social-media noise.
        </p>
      </header>

      <div className="pravaah-archive__tools">
        <fieldset className="pravaah-filter">
          <legend className="pravaah-visually-hidden">Filter signals</legend>
          {FILTERS.map((option) => (
            <button
              aria-pressed={filter === option.value}
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setVisibleCount(PAGE_SIZE);
              }}
              type="button"
            >
              {option.label}
              <span>
                {
                  items.filter((item) => matchesFilter(item, option.value))
                    .length
                }
              </span>
            </button>
          ))}
        </fieldset>
        <label className="pravaah-search">
          <Search aria-hidden="true" />
          <span className="pravaah-visually-hidden">Search signals</span>
          <input
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search title, source or topic"
            type="search"
            value={query}
          />
        </label>
      </div>

      {visibleItems.length ? (
        <>
          <ol className="pravaah-ledger">
            {visibleItems.map((item, index) => (
              <li
                className="pravaah-entry"
                data-emphasis={index % 7 === 0 ? "wide" : "standard"}
                key={item.id}
              >
                <article>
                  <div className="pravaah-entry__meta">
                    <span className="pravaah-entry__source">
                      <SourceIcon source={item.source} />
                      {featureSourceLabel(item.source, item.sourceName)}
                    </span>
                    <time dateTime={item.publishedAt}>
                      {formatDate(item.publishedAt)}
                    </time>
                  </div>

                  {item.media ? (
                    <div className="pravaah-entry__media">
                      <Image
                        alt={item.media.alt}
                        fill
                        sizes={
                          index % 7 === 0
                            ? "(max-width: 760px) 100vw, 58vw"
                            : "(max-width: 760px) 100vw, 30vw"
                        }
                        src={item.media.src}
                      />
                    </div>
                  ) : null}

                  <div className="pravaah-entry__copy">
                    <p className="pravaah-entry__relationship">
                      {item.relationship === "about-akb"
                        ? `Written about AKB by ${item.author}`
                        : item.relationship === "studio"
                          ? "From AKB Studio"
                          : `Published by ${item.author}`}
                    </p>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    {item.tags.length ? (
                      <ul aria-label="Topics">
                        {item.tags.slice(0, 4).map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="pravaah-entry__actions">
                    {item.internalPath ? (
                      <Link href={item.internalPath}>Open context</Link>
                    ) : null}
                    {item.canonicalUrl ? (
                      <a
                        href={item.canonicalUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        View original
                        <ArrowUpRight aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ol>

          {visibleCount < filteredItems.length ? (
            <button
              className="pravaah-load-more"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              type="button"
            >
              Load 12 more
              <span>{filteredItems.length - visibleCount} remaining</span>
            </button>
          ) : null}
        </>
      ) : (
        <div className="pravaah-archive__empty">
          <p className="pravaah-kicker">NO MATCHING SIGNALS</p>
          <h3>The archive has nothing under this filter yet.</h3>
          <p>Change the source filter or search phrase.</p>
        </div>
      )}
    </section>
  );
}
