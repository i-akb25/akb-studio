import "server-only";

import { cache } from "react";
import { z } from "zod";

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
  const token =
    process.env.GITHUB_READ_TOKEN?.trim() ||
    process.env.GITHUB_CONTENT_TOKEN?.trim();

  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "User-Agent": "akb-studio-pravaah",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export const getGitHubDiscoveries = cache(async (): Promise<FeatureItem[]> => {
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

    if (!response.ok) return [];

    const parsed = repositoriesSchema.safeParse(await response.json());
    if (!parsed.success) return [];

    const syncedAt = new Date().toISOString();

    return parsed.data
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
  } catch {
    return [];
  }
});
