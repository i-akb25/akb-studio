import "server-only";

import { Buffer } from "node:buffer";
import { cache } from "react";

import {
  EMPTY_FEATURE_MANIFEST,
  type FeatureItem,
  type FeatureManifest,
  featureManifestSchema,
} from "../model";
import { readStoredFeatureManifest } from "./feature-store";

const OWNER = process.env.AKB_KNOWLEDGE_GITHUB_OWNER ?? "i-akb25";
const REPOSITORY =
  process.env.AKB_KNOWLEDGE_GITHUB_REPO ?? "akb-knowledge-content";
const REF = process.env.AKB_KNOWLEDGE_GITHUB_REF ?? "main";
const MANIFEST_PATH = "content/feature-manifest.json";
const MAX_MANIFEST_BYTES = 512_000;
const TIMEOUT_MS = 10_000;

function readToken(): string | undefined {
  return (
    process.env.AKB_KNOWLEDGE_GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_READ_TOKEN?.trim()
  );
}

function headers(): HeadersInit {
  const token = readToken();

  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "User-Agent": "akb-studio-pravaah",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

type GitHubContent = {
  type?: unknown;
  encoding?: unknown;
  content?: unknown;
  size?: unknown;
};

async function requestManifest(): Promise<FeatureManifest> {
  const path = MANIFEST_PATH.split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(
    OWNER,
  )}/${encodeURIComponent(REPOSITORY)}/contents/${path}?ref=${encodeURIComponent(
    REF,
  )}`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: headers(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
      next: {
        revalidate: 900,
        tags: ["pravaah-manifest"],
      },
    });
  } catch {
    return EMPTY_FEATURE_MANIFEST;
  }

  if (response.status === 404) {
    return EMPTY_FEATURE_MANIFEST;
  }

  if (!response.ok) {
    return EMPTY_FEATURE_MANIFEST;
  }

  const payload = (await response.json()) as GitHubContent;

  if (
    payload.type !== "file" ||
    payload.encoding !== "base64" ||
    typeof payload.content !== "string" ||
    typeof payload.size !== "number" ||
    payload.size > MAX_MANIFEST_BYTES
  ) {
    return EMPTY_FEATURE_MANIFEST;
  }

  try {
    const decoded = Buffer.from(
      payload.content.replace(/\s/g, ""),
      "base64",
    ).toString("utf8");
    const parsed = featureManifestSchema.safeParse(JSON.parse(decoded));

    return parsed.success ? parsed.data : EMPTY_FEATURE_MANIFEST;
  } catch {
    return EMPTY_FEATURE_MANIFEST;
  }
}

export const getFeatureManifest = cache(async (): Promise<FeatureManifest> => {
  const stored = await readStoredFeatureManifest();
  return stored ?? requestManifest();
});

export const getPublishedFeatureItems = cache(
  async (): Promise<FeatureItem[]> => {
    const manifest = await getFeatureManifest();
    const now = Date.now();

    return manifest.items
      .filter((item) => {
        if (item.status === "published") return true;
        if (item.status !== "scheduled") return false;
        return item.publishedAt ? Date.parse(item.publishedAt) <= now : false;
      })
      .sort(
        (left, right) =>
          Number(right.pinned) - Number(left.pinned) ||
          right.priority - left.priority ||
          Date.parse(right.publishedAt ?? right.syncedAt) -
            Date.parse(left.publishedAt ?? left.syncedAt),
      );
  },
);
