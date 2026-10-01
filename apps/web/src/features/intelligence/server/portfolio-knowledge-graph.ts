import "server-only";

import { cache } from "react";
import { getManagedAboutProfile } from "@/features/about/server/managed-about-profile";
import {
  getPublishedJournal,
  getPublishedKnowledge,
} from "@/features/content/server/content-source";
import { getPublishedFeatureItems } from "@/features/pravaah/server/feature-source";
import { publishedProjects } from "@/features/projects/data/project-registry";
import { prisma } from "@/server/db/prisma";
import {
  createPortfolioKnowledgeGraph,
  type KnowledgeDocument,
  type KnowledgeFacet,
  type KnowledgeRelation,
} from "../model";

function facets(
  kind: KnowledgeFacet["kind"],
  values: readonly string[],
): KnowledgeFacet[] {
  return values.map((value) => ({ kind, value }));
}

function contentRelations(
  relations: readonly {
    type: "project" | "journal" | "knowledge";
    slug: string;
  }[],
): KnowledgeRelation[] {
  return relations.map((relation) => ({
    targetId: `${relation.type}:${relation.slug}`,
    type: "references",
  }));
}

function internalPravaahRelation(
  path: string | undefined,
): KnowledgeRelation[] {
  const project = path?.match(/^\/projects\/([^/?#]+)/);
  if (project?.[1]) {
    return [{ targetId: `project:${project[1]}`, type: "references" }];
  }
  const journal = path?.match(/^\/journal\/([^/?#]+)/);
  if (journal?.[1]) {
    return [{ targetId: `journal:${journal[1]}`, type: "references" }];
  }
  const knowledge = path?.match(/^\/knowledge\/[^/?#]+\/([^/?#]+)/);
  if (knowledge?.[1]) {
    return [{ targetId: `knowledge:${knowledge[1]}`, type: "references" }];
  }
  return [];
}

export const getPortfolioKnowledgeGraph = cache(async () => {
  const [about, managedProjects, journal, knowledge, pravaah] =
    await Promise.all([
      getManagedAboutProfile().catch(() => null),
      process.env.DATABASE_URL
        ? prisma.project
            .findMany({
              where: { state: "PUBLISHED", aevaApproved: true },
              include: { technologies: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            })
            .catch(() => [])
        : Promise.resolve([]),
      getPublishedJournal().catch(() => []),
      getPublishedKnowledge().catch(() => []),
      getPublishedFeatureItems().catch(() => []),
    ]);
  const documents: KnowledgeDocument[] = [];

  if (about) {
    documents.push({
      id: "profile:about",
      kind: "profile",
      title: `About ${about.name}`,
      summary: about.introduction,
      url: "/about",
      body: [about.headline, about.thesis, about.current.body].join(" "),
      facets: facets(
        "discipline",
        about.disciplines.map((discipline) => discipline.label),
      ),
      relations: [],
      provenance: { owner: "akb-studio", sourceId: "about-profile" },
    });
  }

  for (const project of managedProjects) {
    documents.push({
      id: `project:${project.slug}`,
      kind: "project",
      title: project.title,
      summary: project.summary,
      url: `/projects/${project.slug}`,
      body: [
        project.categoryLabel,
        project.role ?? "",
        project.period ?? "",
        project.lifecycle,
      ].join(" "),
      facets: [
        ...facets("discipline", project.disciplines),
        ...facets(
          "technology",
          project.technologies.map((technology) => technology.name),
        ),
      ],
      relations: [],
      provenance: { owner: "akb-studio", sourceId: project.slug },
    });
  }

  for (const project of publishedProjects) {
    documents.push({
      id: `project:${project.slug}`,
      kind: "project",
      title: project.title,
      summary: project.summary,
      url: `/projects/${project.slug}`,
      body: [
        project.categoryLabel,
        project.role ?? "",
        project.period ?? "",
        project.lifecycle,
      ].join(" "),
      facets: [
        ...facets("discipline", project.disciplines),
        ...facets(
          "technology",
          project.technologies.map((technology) => technology.name),
        ),
      ],
      relations: [],
      provenance: { owner: "akb-studio", sourceId: project.slug },
    });
  }

  for (const item of journal) {
    documents.push({
      id: `journal:${item.slug}`,
      kind: "journal",
      title: item.title,
      summary: item.description,
      url: item.canonicalPath,
      body: [item.series ?? "", item.source.label].join(" "),
      facets: [
        ...facets("discipline", item.disciplines),
        ...facets("topic", item.topics),
        ...facets("tag", item.tags),
      ],
      relations: contentRelations(item.relations),
      provenance: {
        owner: "akb-knowledge-content",
        sourceId: item.id,
        updatedAt: item.updatedAt ?? item.publishedAt,
      },
    });
  }

  for (const item of knowledge) {
    documents.push({
      id: `knowledge:${item.slug}`,
      kind: "knowledge",
      title: item.title,
      summary: item.description,
      url: item.canonicalPath,
      body: [item.kind, item.series ?? "", item.source.label].join(" "),
      facets: [
        ...facets("discipline", item.disciplines),
        ...facets("topic", item.topics),
        ...facets("tag", item.tags),
      ],
      relations: contentRelations(item.relations),
      provenance: {
        owner: "akb-knowledge-content",
        sourceId: item.id,
        updatedAt: item.updatedAt ?? item.publishedAt,
      },
    });
  }

  for (const item of pravaah) {
    documents.push({
      id: `pravaah:${item.id}`,
      kind: "pravaah",
      title: item.title,
      summary: item.excerpt,
      url: item.internalPath ?? item.canonicalUrl ?? "/pravaah",
      body: [item.author, item.source, item.type, item.relationship].join(" "),
      facets: facets("tag", item.tags),
      relations: internalPravaahRelation(item.internalPath),
      provenance: {
        owner: "akb-knowledge-content",
        sourceId: item.id,
        updatedAt: item.syncedAt,
      },
    });
  }

  return createPortfolioKnowledgeGraph(documents);
});
