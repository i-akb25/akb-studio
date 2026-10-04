import type { MetadataRoute } from "next";
import {
  getPublishedJournal,
  getPublishedKnowledge,
} from "@/features/content/server/content-source";
import { getProjectRegistry } from "@/features/projects/server/resolve-project-registry";
import { absoluteSiteUrl } from "@/features/seo/site-config";

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  options: Omit<SitemapEntry, "url">,
): SitemapEntry | null {
  const url = absoluteSiteUrl(path);
  return url ? { url, ...options } : null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!absoluteSiteUrl("/")) return [];

  const [journal, knowledge, projects] = await Promise.all([
    getPublishedJournal(),
    getPublishedKnowledge(),
    getProjectRegistry(),
  ]);

  const staticEntries = [
    entry("/", { changeFrequency: "weekly", priority: 1 }),
    entry("/projects", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/journal", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/knowledge", { changeFrequency: "weekly", priority: 0.9 }),
    entry("/pravaah", { changeFrequency: "daily", priority: 0.8 }),
    entry("/about", { changeFrequency: "monthly", priority: 0.8 }),
    entry("/aeva", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/contact", { changeFrequency: "monthly", priority: 0.7 }),
    entry("/privacy", { changeFrequency: "yearly", priority: 0.3 }),
    entry("/terms", { changeFrequency: "yearly", priority: 0.3 }),
    entry("/cookies", { changeFrequency: "yearly", priority: 0.2 }),
    entry("/data-policy", { changeFrequency: "yearly", priority: 0.2 }),
  ].filter((item): item is SitemapEntry => item !== null);

  const projectEntries = projects
    .filter((project) => project.publication === "published")
    .map((project) =>
      entry(`/projects/${project.slug}`, {
        changeFrequency: "monthly",
        priority: project.tier === "flagship" ? 0.9 : 0.7,
      }),
    )
    .filter((item): item is SitemapEntry => item !== null);

  const contentEntries = [...journal, ...knowledge]
    .map((record) =>
      entry(record.canonicalPath, {
        lastModified: new Date(record.updatedAt ?? record.publishedAt),
        changeFrequency: "monthly",
        priority: record.kind === "journal" ? 0.8 : 0.7,
      }),
    )
    .filter((item): item is SitemapEntry => item !== null);

  return [...staticEntries, ...projectEntries, ...contentEntries];
}
