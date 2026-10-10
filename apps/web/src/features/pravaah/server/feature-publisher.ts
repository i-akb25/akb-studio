import "server-only";

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { recordOperationalHealth } from "@/server/analytics/metrics";

import {
  EMPTY_FEATURE_MANIFEST,
  type FeatureItem,
  type FeatureManifest,
  type FeatureRelationship,
  type FeatureSource,
  type FeatureType,
  featureItemSchema,
  featureManifestSchema,
} from "../model";
import {
  readStoredFeatureManifest,
  saveStoredFeatureManifest,
} from "./feature-store";
import { getGitHubDiscoveries } from "./github-adapter";

const OWNER = process.env.AKB_KNOWLEDGE_GITHUB_OWNER ?? "i-akb25";
const REPOSITORY =
  process.env.AKB_KNOWLEDGE_GITHUB_REPO ?? "akb-knowledge-content";
const REF = process.env.AKB_KNOWLEDGE_GITHUB_REF ?? "main";
const MANIFEST_PATH = "content/feature-manifest.json";
const TIMEOUT_MS = 12_000;

function writeToken(): string | undefined {
  const value =
    process.env.AKB_KNOWLEDGE_GITHUB_WRITE_TOKEN?.trim() ||
    process.env.GITHUB_CONTENT_TOKEN?.trim();
  return value || undefined;
}

function readToken(): string | undefined {
  return (
    process.env.AKB_KNOWLEDGE_GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_READ_TOKEN?.trim() ||
    writeToken()
  );
}

function repositoryError(operation: string, status: number): Error {
  if (status === 401 || status === 403) {
    return new Error(
      "Pravaah repository access was denied. The configured token needs Contents: Read and write access to the private knowledge repository.",
    );
  }
  if (status === 404) {
    return new Error(
      "Pravaah repository or branch was not found. Confirm that the configured repository and ref still exist.",
    );
  }
  if (status === 409) {
    return new Error(
      "Pravaah repository changed while this item was being saved. Refresh the page and submit it again.",
    );
  }
  if (status === 422) {
    return new Error(
      "Pravaah repository rejected the update. Confirm that the configured branch accepts content updates.",
    );
  }
  return new Error(`Pravaah repository ${operation} failed (${status}).`);
}

function headers(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "akb-studio-pravaah",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubRequest(
  input: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      "Pravaah repository could not be reached. Try again after confirming GitHub availability and the Vercel token configuration.",
    );
  }
}

async function writableManifest(): Promise<FeatureManifest> {
  const stored = await readStoredFeatureManifest();
  if (stored) return stored;
  const token = readToken();
  if (!token) return EMPTY_FEATURE_MANIFEST;
  const path = MANIFEST_PATH.split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const response = await githubRequest(
    `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/${path}?ref=${encodeURIComponent(
      REF,
    )}`,
    {
      headers: headers(token),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  if (response.status === 404) return EMPTY_FEATURE_MANIFEST;
  if (!response.ok) throw repositoryError("read", response.status);

  const payload = (await response.json()) as {
    type?: unknown;
    encoding?: unknown;
    content?: unknown;
  };

  if (
    payload.type !== "file" ||
    payload.encoding !== "base64" ||
    typeof payload.content !== "string"
  ) {
    throw new Error("Feature registry response is invalid");
  }

  const decoded = Buffer.from(
    payload.content.replace(/\s/g, ""),
    "base64",
  ).toString("utf8");
  const parsed = featureManifestSchema.safeParse(JSON.parse(decoded));

  if (!parsed.success) throw new Error("Feature registry is invalid");
  return parsed.data;
}

async function currentSha(token: string): Promise<string | undefined> {
  const path = MANIFEST_PATH.split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const response = await githubRequest(
    `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/${path}?ref=${encodeURIComponent(
      REF,
    )}`,
    {
      headers: headers(token),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  if (response.status === 404) return undefined;
  if (!response.ok) throw repositoryError("lookup", response.status);

  const payload = (await response.json()) as { sha?: unknown };
  return typeof payload.sha === "string" ? payload.sha : undefined;
}

async function mirrorManifest(
  manifest: FeatureManifest,
  message: string,
): Promise<void> {
  const token = writeToken();
  if (!token) {
    await recordOperationalHealth({
      key: "social_github_mirror",
      status: "disabled",
      summary: "No Pravaah mirror write credential is configured.",
    });
    return;
  }
  const path = MANIFEST_PATH.split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const sha = await currentSha(token);
  const response = await githubRequest(
    `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message,
        content: Buffer.from(
          `${JSON.stringify(manifest, null, 2)}\n`,
          "utf8",
        ).toString("base64"),
        branch: REF,
        ...(sha ? { sha } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );

  if (!response.ok) throw repositoryError("publish", response.status);
  await recordOperationalHealth({
    key: "social_github_mirror",
    status: "healthy",
    summary: "The reviewed Pravaah manifest was mirrored successfully.",
  });
}

async function writeManifest(
  manifest: FeatureManifest,
  input: {
    action: "CREATE" | "UPDATE" | "PUBLISH" | "DELETE";
    entityId?: string;
    message: string;
  },
): Promise<void> {
  await saveStoredFeatureManifest({ manifest, ...input });

  // Git remains a recoverable content mirror. A missing, expired or
  // branch-restricted token must not break the authenticated Admin controls.
  try {
    await mirrorManifest(manifest, input.message);
  } catch (error) {
    await recordOperationalHealth({
      key: "social_github_mirror",
      status: "degraded",
      summary:
        error instanceof Error
          ? error.message
          : "The Pravaah mirror update failed.",
    });
    // Neon is authoritative for Admin changes; the public reader still uses
    // the Git manifest whenever Neon is unavailable.
  }

  revalidateTag("pravaah-manifest", "max");
  revalidatePath("/pravaah");
  revalidatePath("/admin/pravaah");
}

function withItem(
  manifest: FeatureManifest,
  item: FeatureItem,
): FeatureManifest {
  return {
    ...manifest,
    items: [item, ...manifest.items.filter((entry) => entry.id !== item.id)],
  };
}

export async function featureGitHubDiscovery(
  externalId: string,
): Promise<void> {
  const discoveries = await getGitHubDiscoveries();
  const discovery = discoveries.find(
    (candidate) => candidate.externalId === externalId,
  );

  if (!discovery) throw new Error("GitHub discovery is unavailable");

  const manifest = await writableManifest();
  const item = featureItemSchema.parse({
    ...discovery,
    status: "published",
    syncedAt: new Date().toISOString(),
  });

  await writeManifest(withItem(manifest, item), {
    action: "PUBLISH",
    entityId: item.id,
    message: `Feature GitHub item: ${item.title}`,
  });
}

export async function ignoreGitHubDiscovery(externalId: string): Promise<void> {
  const manifest = await writableManifest();

  await writeManifest(
    {
      ...manifest,
      ignoredExternalIds: Array.from(
        new Set([externalId, ...manifest.ignoredExternalIds]),
      ).slice(0, 1000),
    },
    {
      action: "UPDATE",
      entityId: externalId,
      message: "Ignore GitHub discovery",
    },
  );
}

export async function publishManualFeature(input: {
  source: FeatureSource;
  sourceName?: string;
  type: FeatureType;
  title: string;
  excerpt: string;
  author: string;
  relationship: FeatureRelationship;
  canonicalUrl?: string;
  mediaSrc?: string;
  mediaAlt?: string;
  publishedAt?: string;
  tags: string[];
  pinned: boolean;
  priority: number;
  status: "published" | "scheduled";
}): Promise<void> {
  const now = new Date().toISOString();
  const id = `feature-${randomUUID()}`;
  const item = featureItemSchema.parse({
    id,
    source: input.source,
    ...(input.sourceName ? { sourceName: input.sourceName } : {}),
    type: input.type,
    title: input.title,
    excerpt: input.excerpt,
    ...(input.canonicalUrl ? { canonicalUrl: input.canonicalUrl } : {}),
    ...(input.mediaSrc && input.mediaAlt
      ? { media: { src: input.mediaSrc, alt: input.mediaAlt } }
      : {}),
    publishedAt: input.publishedAt || now,
    syncedAt: now,
    author: input.author,
    relationship: input.relationship,
    tags: input.tags,
    pinned: input.pinned,
    priority: input.priority,
    status: input.status,
  });
  const manifest = await writableManifest();

  await writeManifest(withItem(manifest, item), {
    action: "PUBLISH",
    entityId: item.id,
    message: `Publish Pravaah item: ${item.title}`,
  });
}

export async function updateFeatureState(input: {
  id: string;
  status?: "published" | "hidden" | "archived";
  pinned?: boolean;
  media?: FeatureItem["media"] | null;
}): Promise<void> {
  const manifest = await writableManifest();
  const current = manifest.items.find((item) => item.id === input.id);

  if (!current)
    throw new Error(
      "The Pravaah item is no longer present in the publishing repository. Refresh the Admin page before trying again.",
    );

  const candidate: Record<string, unknown> = {
    ...current,
    ...(input.status ? { status: input.status } : {}),
    ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
    syncedAt: new Date().toISOString(),
  };

  if (input.media === null) delete candidate.media;
  else if (input.media !== undefined) candidate.media = input.media;

  const updated = featureItemSchema.parse(candidate);

  await writeManifest(withItem(manifest, updated), {
    action: "UPDATE",
    entityId: updated.id,
    message: `Update Pravaah item: ${updated.title}`,
  });
}

export async function deleteFeatureItem(id: string): Promise<void> {
  const manifest = await writableManifest();
  const current = manifest.items.find((item) => item.id === id);

  if (!current)
    throw new Error(
      "The Pravaah item is no longer present in the publishing repository. Refresh the Admin page before trying again.",
    );

  await writeManifest(
    {
      ...manifest,
      items: manifest.items.filter((item) => item.id !== id),
    },
    {
      action: "DELETE",
      entityId: current.id,
      message: `Delete Pravaah item: ${current.title}`,
    },
  );
}
