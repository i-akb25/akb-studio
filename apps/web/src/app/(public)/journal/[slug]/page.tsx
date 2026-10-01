import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JournalDetail } from "@/features/content/components/journal-detail";
import "@/features/content/content-surface.css";
import "@/features/content/journal-surface.css";
import {
  getJournalBySlug,
  getPublishedJournal,
  getRelatedContent,
} from "@/features/content/server/content-source";
import { getPublicVartalap } from "@/features/content/server/public-vartalap";
import { createPageMetadata } from "@/features/seo/site-config";
import {
  articleStructuredData,
  StructuredData,
} from "@/features/seo/structured-data";

type PageProps = { params: Promise<{ slug: string }> };
export async function generateStaticParams() {
  const records = await getPublishedJournal();
  return records.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const record = await getJournalBySlug(slug);
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
export default async function JournalArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const record = await getJournalBySlug(slug);
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
      <JournalDetail record={record} related={related} threads={threads} />
    </>
  );
}
