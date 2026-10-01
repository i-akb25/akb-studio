import type { Metadata } from "next";

import { KnowledgeIndex } from "@/features/content/components/knowledge-index";
import "@/features/content/content-discovery.css";
import "@/features/content/content-surface.css";
import "@/features/content/knowledge-surface.css";
import {
  matchesContentFilters,
  parseContentDiscipline,
  parseKnowledgeKind,
} from "@/features/content/model";
import { getPublishedKnowledge } from "@/features/content/server/content-source";
import { getPublicVartalap } from "@/features/content/server/public-vartalap";
import { createPageMetadata } from "@/features/seo/site-config";

const knowledgeMetadata = createPageMetadata({
  title: "Knowledge",
  description:
    "A connected technical atlas of notes, research, reading and engineering learning paths.",
  path: "/knowledge",
});

type PageProps = {
  searchParams: Promise<{
    q?: string;
    discipline?: string;
    kind?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = Boolean(
    params.q?.trim() || params.discipline?.trim() || params.kind?.trim(),
  );

  return {
    ...knowledgeMetadata,
    alternates: {
      ...knowledgeMetadata.alternates,
      types: { "application/rss+xml": "/knowledge/feed.xml" },
    },
    ...(isFiltered
      ? { robots: { index: false, follow: true, noarchive: true } }
      : {}),
  };
}

export default async function KnowledgePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const discipline = parseContentDiscipline(params.discipline);
  const knowledgeKind = parseKnowledgeKind(params.kind);
  const [allRecords, threads] = await Promise.all([
    getPublishedKnowledge(),
    getPublicVartalap("knowledge:index"),
  ]);
  const records = allRecords.filter((record) =>
    matchesContentFilters(record, { query, discipline, knowledgeKind }),
  );

  return (
    <KnowledgeIndex
      records={records}
      query={query}
      discipline={discipline ?? ""}
      knowledgeKind={knowledgeKind ?? ""}
      threads={threads}
    />
  );
}
