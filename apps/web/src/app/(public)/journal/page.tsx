import type { Metadata } from "next";

import { JournalIndex } from "@/features/content/components/journal-index";
import "@/features/content/content-discovery.css";
import "@/features/content/content-surface.css";
import "@/features/content/journal-surface.css";
import {
  matchesContentFilters,
  parseContentDiscipline,
} from "@/features/content/model";
import { getPublishedJournal } from "@/features/content/server/content-source";
import { getPublicVartalap } from "@/features/content/server/public-vartalap";
import { createPageMetadata } from "@/features/seo/site-config";

const journalMetadata = createPageMetadata({
  title: "Engineering Journal",
  description:
    "Engineering decisions, investigations, experiments, postmortems and lessons from AKB Studio.",
  path: "/journal",
});

type PageProps = {
  searchParams: Promise<{ q?: string; discipline?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = Boolean(params.q?.trim() || params.discipline?.trim());

  return {
    ...journalMetadata,
    alternates: {
      ...journalMetadata.alternates,
      types: { "application/rss+xml": "/journal/feed.xml" },
    },
    ...(isFiltered
      ? { robots: { index: false, follow: true, noarchive: true } }
      : {}),
  };
}

export default async function JournalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const discipline = parseContentDiscipline(params.discipline);
  const [allRecords, threads] = await Promise.all([
    getPublishedJournal(),
    getPublicVartalap("journal:index"),
  ]);
  const records = allRecords.filter((record) =>
    matchesContentFilters(record, { query, discipline }),
  );

  return (
    <JournalIndex
      records={records}
      query={query}
      discipline={discipline ?? ""}
      threads={threads}
    />
  );
}
