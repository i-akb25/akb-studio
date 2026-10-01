import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectCaseStudy } from "@/features/projects/components/project-case-study";
import { getGitHubProjectBySlug } from "@/features/projects/server/github-project-source";
import { createPageMetadata } from "@/features/seo/site-config";
import {
  projectStructuredData,
  StructuredData,
} from "@/features/seo/structured-data";

export const revalidate = 3600;

type ProjectCaseStudyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProjectCaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = await getGitHubProjectBySlug(slug);

  if (!document) {
    return {
      title: "Project not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { frontmatter, repository } = document;
  const canonicalPath = `/projects/${frontmatter.slug}`;
  const cover = frontmatter.cover;
  const metadata = createPageMetadata({
    title: `${frontmatter.title} — Project case study`,
    description: frontmatter.summary,
    path: canonicalPath,
    type: "article",
    ...(cover ? { image: cover.src, imageAlt: cover.alt } : {}),
  });

  return {
    ...metadata,
    keywords: [
      ...frontmatter.disciplines.map((discipline) =>
        discipline
          .split("-")
          .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
          .join(" "),
      ),
      ...frontmatter.technologies.map((technology) => technology.name),
    ],
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt ?? frontmatter.publishedAt,
      authors: ["Anurag Kumar Bharti"],
      tags: frontmatter.technologies.map((technology) => technology.name),
    },
    ...(repository.isAvailable
      ? { other: { "source-repository": repository.htmlUrl } }
      : {}),
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { slug } = await params;
  const document = await getGitHubProjectBySlug(slug);

  if (!document) {
    notFound();
  }

  const { frontmatter, repository } = document;
  const jsonLd = projectStructuredData({
    path: `/projects/${frontmatter.slug}`,
    title: frontmatter.title,
    description: frontmatter.summary,
    publishedAt: frontmatter.publishedAt,
    updatedAt: frontmatter.updatedAt ?? frontmatter.publishedAt,
    image: frontmatter.cover?.src,
    technologies: [
      ...frontmatter.disciplines,
      ...frontmatter.technologies.map((technology) => technology.name),
    ],
    repositoryUrl: repository.isAvailable ? repository.htmlUrl : undefined,
  });

  return (
    <>
      {jsonLd ? <StructuredData data={jsonLd} /> : null}

      <ProjectCaseStudy document={document} />
    </>
  );
}
