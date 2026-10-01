import "server-only";

import { cache } from "react";
import { prisma } from "@/server/db/prisma";
import { publishedProjects } from "../data/project-registry";
import type {
  ProjectDiscipline,
  ProjectImage,
  ProjectRecord,
  TechnologyIcon,
} from "../types/project";
import { getGitHubProjectRecords } from "./github-project-source";

export type HomepageProject = ProjectRecord & {
  homepageOrder: number;
  cover: ProjectImage;
};

function isDiscipline(value: string): value is ProjectDiscipline {
  return ["software", "electrical", "robotics", "automation", "ai"].includes(
    value,
  );
}

export const getProjectRegistry = cache(
  async (): Promise<readonly ProjectRecord[]> => {
    const gitProjects =
      (await getGitHubProjectRecords()) ??
      publishedProjects.map((project) => ({
        ...project,
        caseStudyState: "unavailable" as const,
      }));
    if (!process.env.DATABASE_URL)
      return [...gitProjects].sort((a, b) => a.order - b.order);
    try {
      const managed = await prisma.project.findMany({
        where: { state: "PUBLISHED" },
        include: {
          coverAsset: true,
          links: { orderBy: { order: "asc" } },
          technologies: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      });
      const mapped: ProjectRecord[] = managed.map((project) => ({
        order: project.order,
        slug: project.slug,
        title: project.title,
        ...(project.shortTitle ? { shortTitle: project.shortTitle } : {}),
        categoryLabel: project.categoryLabel,
        summary: project.summary,
        disciplines: project.disciplines.filter(isDiscipline),
        tier: project.tier as ProjectRecord["tier"],
        lifecycle: project.lifecycle as ProjectRecord["lifecycle"],
        publication: "published",
        caseStudyState: "unavailable",
        ...(project.period ? { period: project.period } : {}),
        ...(project.role ? { role: project.role } : {}),
        ...(project.homepageOrder !== null
          ? { homepageOrder: project.homepageOrder }
          : {}),
        ...(project.coverAsset?.state === "READY"
          ? {
              cover: {
                kind: "image" as const,
                src: project.coverAsset.secureUrl,
                alt: project.coverAsset.altText,
                width: project.coverAsset.width ?? undefined,
                height: project.coverAsset.height ?? undefined,
              },
            }
          : {}),
        technologies: project.technologies.map((item) => ({
          name: item.name,
          icon: item.icon as TechnologyIcon,
        })),
        links: project.links.map((link) =>
          link.url
            ? {
                kind: link.kind as
                  | "repository"
                  | "demo"
                  | "package"
                  | "documentation",
                label: link.label,
                state: "available" as const,
                href: link.url,
              }
            : {
                kind: link.kind as
                  | "repository"
                  | "demo"
                  | "package"
                  | "documentation",
                label: link.label,
                state: "unavailable" as const,
              },
        ),
      }));
      const bySlug = new Map(
        gitProjects.map((project) => [project.slug, project]),
      );
      for (const project of mapped) bySlug.set(project.slug, project);
      return [...bySlug.values()].sort((a, b) => a.order - b.order);
    } catch {
      return [...gitProjects].sort((a, b) => a.order - b.order);
    }
  },
);

export const getHomepageProjects = cache(
  async (): Promise<HomepageProject[]> =>
    (await getProjectRegistry())
      .filter(
        (project): project is HomepageProject =>
          project.publication === "published" &&
          project.homepageOrder !== undefined &&
          project.cover !== undefined,
      )
      .sort((a, b) => a.homepageOrder - b.homepageOrder),
);
