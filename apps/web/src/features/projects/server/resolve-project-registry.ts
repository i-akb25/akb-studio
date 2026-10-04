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
  cover?: ProjectImage;
};

const HOMEPAGE_PROJECTS = [
  "veyra",
  "codevet",
  "titan-os",
  "automated-drone-delivery",
  "adhayan-lms",
] as const;

function isDiscipline(value: string): value is ProjectDiscipline {
  return ["software", "electrical", "robotics", "automation", "ai"].includes(
    value,
  );
}

export const getProjectRegistry = cache(
  async (): Promise<readonly ProjectRecord[]> => {
    let gitProjects: ProjectRecord[];
    try {
      gitProjects =
        (await getGitHubProjectRecords()) ??
        publishedProjects.map((project) => ({ ...project }));
    } catch {
      gitProjects = publishedProjects.map((project) => ({ ...project }));
    }
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
      const bySlug = new Map(
        gitProjects.map((project) => [project.slug, project]),
      );
      for (const project of managed) {
        const existing = bySlug.get(project.slug);
        const mapped: ProjectRecord = {
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
          caseStudyState: existing?.caseStudyState ?? "unavailable",
          ...(project.period ? { period: project.period } : {}),
          ...(project.role ? { role: project.role } : {}),
          ...(project.homepageOrder !== null
            ? { homepageOrder: project.homepageOrder }
            : existing?.homepageOrder !== undefined
              ? { homepageOrder: existing.homepageOrder }
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
            : existing?.cover
              ? { cover: existing.cover }
              : {}),
          technologies: project.technologies.length
            ? project.technologies.map((item) => ({
                name: item.name,
                icon: item.icon as TechnologyIcon,
              }))
            : (existing?.technologies ?? []),
          links: project.links.length
            ? project.links.map((link) =>
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
              )
            : (existing?.links ?? []),
        };
        bySlug.set(project.slug, mapped);
      }
      return [...bySlug.values()].sort((a, b) => a.order - b.order);
    } catch {
      return [...gitProjects].sort((a, b) => a.order - b.order);
    }
  },
);

export const getHomepageProjects = cache(
  async (): Promise<HomepageProject[]> => {
    const bySlug = new Map(
      (await getProjectRegistry()).map((project) => [project.slug, project]),
    );

    return HOMEPAGE_PROJECTS.flatMap((slug, index) => {
      const project = bySlug.get(slug);
      if (!project || project.publication !== "published") return [];
      return [{ ...project, homepageOrder: index + 1 }];
    });
  },
);
