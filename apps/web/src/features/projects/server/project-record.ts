import type { ProjectRecord } from "../types/project";
import type { ProjectManifestEntry } from "./project-content-schema";

const caseStudyStateByStatus = {
  draft: "planned",
  "under-review": "under-review",
  published: "published",
} as const;

export function createProjectRecord(
  project: ProjectManifestEntry,
): ProjectRecord {
  if (project.publication !== "published") {
    throw new Error("Only published projects can become public records");
  }

  return {
    order: project.order,
    slug: project.slug,
    title: project.title,
    categoryLabel: project.categoryLabel,
    summary: project.summary,
    tier: project.tier,
    lifecycle: project.lifecycle,
    publication: "published",
    caseStudyState: caseStudyStateByStatus[project.caseStudy.status],
    disciplines: project.disciplines,
    technologies: project.technologies,
    links: project.links,
    role: project.role,
    ...(project.period !== undefined ? { period: project.period } : {}),
    ...(project.homepageOrder !== undefined
      ? { homepageOrder: project.homepageOrder }
      : {}),
    ...(project.cover
      ? {
          cover: {
            kind: "image",
            src: project.cover.src,
            alt: project.cover.alt,
          },
        }
      : {}),
  };
}
