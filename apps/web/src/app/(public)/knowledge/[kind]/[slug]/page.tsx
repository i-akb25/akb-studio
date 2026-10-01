import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KnowledgeDetail } from "@/features/content/components/knowledge-detail";
import "@/features/content/content-surface.css";
import "@/features/content/knowledge-surface.css";
import {
  KNOWLEDGE_KINDS,
  type KnowledgeKind,
  knowledgeRouteKind,
} from "@/features/content/model";
import {
  getKnowledgeBySlug,
  getPublishedKnowledge,
  getRelatedContent,
} from "@/features/content/server/content-source";
import { getPublicVartalap } from "@/features/content/server/public-vartalap";
import { createPageMetadata } from "@/features/seo/site-config";
import {
  articleStructuredData,
  StructuredData,
} from "@/features/seo/structured-data";

type PageProps = { params: Promise<{ kind: string; slug: string }> };
function normalizeKind(value: string): KnowledgeKind | null {
  const kind =
    value === "notes"
      ? "note"
      : value === "research"
        ? "research"
        : value === "reading"
          ? "reading"
          : value === "roadmaps"
            ? "roadmap"
            : value === "reflections"
              ? "reflection"
              : null;
  return kind && KNOWLEDGE_KINDS.includes(kind) ? kind : null;
}
export async function generateStaticParams() {
  const records = await getPublishedKnowledge();
  return records.map((record) => ({
    kind: knowledgeRouteKind(record.kind),
    slug: record.slug,
  }));
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { kind: segment, slug } = await params;
  const kind = normalizeKind(segment);
  if (!kind) return {};
  const record = await getKnowledgeBySlug(kind, slug);
  if (!record) return {};
  const title = record.seo?.title ?? record.title;
  const description = record.seo?.description ?? record.description;
  const image = record.seo?.image ?? record.cover?.src;
  const metadata = createPageMetadata({
    title,
    description,
    path: record.canonicalPath,
    type: "article",
    ...(image ? { image, imageAlt: record.cover?.alt ?? record.title } : {}),
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: record.publishedAt,
      modifiedTime: record.updatedAt,
      authors: ["Anurag Kumar Bharti"],
      tags: [...record.disciplines, ...record.topics],
    },
  };
}
export default async function KnowledgeDetailPage({ params }: PageProps) {
  const { kind: segment, slug } = await params;
  const kind = normalizeKind(segment);
  if (!kind) notFound();
  const record = await getKnowledgeBySlug(kind, slug);
  if (!record) notFound();
  const [related, threads] = await Promise.all([
    getRelatedContent(record),
    getPublicVartalap(record.id),
  ]);
  const jsonLd = articleStructuredData({
    path: record.canonicalPath,
    title: record.title,
    description: record.description,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt,
    image: record.seo?.image ?? record.cover?.src,
    topics: [...record.disciplines, ...record.topics, ...record.tags],
    sourceUrl: record.source.url,
  });

  return (
    <>
      {jsonLd ? <StructuredData data={jsonLd} /> : null}
      <KnowledgeDetail record={record} related={related} threads={threads} />
    </>
  );
}
