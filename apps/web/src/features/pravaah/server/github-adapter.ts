import "server-only";

import { cache } from "react";
import { z } from "zod";
import { recordOperationalHealth } from "@/server/analytics/metrics";

import type { FeatureItem } from "../model";

const repositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  fork: z.boolean(),
  archived: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  pushed_at: z.string().datetime().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()).default([]),
  owner: z.object({
    login: z.string(),
  }),
});

const repositoriesSchema = z.array(repositorySchema);
const TIMEOUT_MS = 10_000;

function headers(): HeadersInit {
  const token = process.env.GITHUB_READ_TOKEN?.trim();

  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "User-Agent": "akb-studio-pravaah",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export type GitHubDiscoveryResult = {
  items: FeatureItem[];
  status: "healthy" | "degraded";
  detail: string;
};

export const getGitHubDiscoveryResult = cache(
  async (): Promise<GitHubDiscoveryResult> => {
    const username = process.env.AKB_GITHUB_USERNAME?.trim() || "i-akb25";
    const endpoint = `https://api.github.com/users/${encodeURIComponent(
      username,
    )}/repos?type=owner&sort=pushed&direction=desc&per_page=30`;

    try {
      const response = await fetch(endpoint, {
        headers: headers(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: "error",
        next: {
          revalidate: 3600,
          tags: ["pravaah-github"],
        },
      });

      if (!response.ok) {
        const detail =
          response.status === 401 || response.status === 403
            ? "GitHub discovery was denied or rate limited."
            : `GitHub discovery returned status ${response.status}.`;
        await recordOperationalHealth({
          key: "social_github_discovery",
          status: "degraded",
          summary: detail,
        });
        return { items: [], status: "degraded", detail };
      }

      const parsed = repositoriesSchema.safeParse(await response.json());
      if (!parsed.success) {
        const detail = "GitHub discovery returned an invalid response.";
        await recordOperationalHealth({
          key: "social_github_discovery",
          status: "degraded",
          summary: detail,
        });
        return { items: [], status: "degraded", detail };
      }

      const syncedAt = new Date().toISOString();

      const items = parsed.data
        .filter((repository) => !repository.fork && !repository.archived)
        .map((repository): FeatureItem => {
          const publishedAt =
            repository.pushed_at ??
            repository.updated_at ??
            repository.created_at;
          const details = repository.description?.trim();
          const excerpt =
            details && details.length >= 10
              ? details
              : `Public repository maintained by ${repository.owner.login}.`;

          return {
            id: `github-repository-${repository.id}`,
            externalId: `github:repository:${repository.id}`,
            source: "github",
            type: "project",
            title: repository.name,
            excerpt,
            canonicalUrl: repository.html_url,
            publishedAt,
            syncedAt,
            author: repository.owner.login,
            relationship: "by-akb",
            tags: [
              ...(repository.language ? [repository.language] : []),
              ...repository.topics,
            ].slice(0, 12),
            pinned: false,
            priority: 0,
            status: "pending",
          };
        });
      const detail = `GitHub discovery returned ${items.length} reviewed candidate(s).`;
      await recordOperationalHealth({
        key: "social_github_discovery",
        status: "healthy",
        summary: detail,
      });
      return { items, status: "healthy", detail };
    } catch {
      const detail =
        "GitHub discovery did not respond before the bounded timeout.";
      await recordOperationalHealth({
        key: "social_github_discovery",
        status: "degraded",
        summary: detail,
      });
      return { items: [], status: "degraded", detail };
    }
  },
);

export async function getGitHubDiscoveries(): Promise<FeatureItem[]> {
  return (await getGitHubDiscoveryResult()).items;
}
