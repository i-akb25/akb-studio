import "server-only";

import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { cache } from "react";
import { z } from "zod";

import type { ProjectRecord } from "../types/project";
import {
  PORTFOLIO_MANIFEST_PATH,
  type ProjectContentDocument,
  type ProjectManifestEntry,
  projectContentDocumentSchema,
  projectContentManifestSchema,
} from "./project-content-schema";
import { createProjectRecord } from "./project-record";

const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const REVALIDATION_SECONDS = 3600;
const CONTENT_REQUEST_TIMEOUT_MS = 12_000;
const MAX_MANIFEST_BYTES = 512_000;
const MAX_CASE_STUDY_BYTES = 256_000;

const githubContentFileSchema = z.object({
  type: z.literal("file"),
  encoding: z.literal("base64"),
  content: z.string(),
  size: z.number().int().nonnegative(),
});

type GitHubContentConfig = {
  owner: string;
  repository: string;
  ref: string;
  token: string;
};

type TechnologyCategory =
  ProjectContentDocument["frontmatter"]["technologies"][number]["category"];

const technologyCategoryByIcon: Record<
  ProjectManifestEntry["technologies"][number]["icon"],
  Exclude<TechnologyCategory, undefined>
> = {
  code: "language",
  database: "database",
  server: "platform",
  ai: "tool",
  hardware: "hardware",
  network: "protocol",
  tool: "tool",
};

export class GitHubProjectSourceError extends Error {
  readonly status?: number;

  constructor(
    message: string,
    options?: {
      cause?: unknown;
      status?: number;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = "GitHubProjectSourceError";
    this.status = options?.status;
  }
}

function getContentConfig(): GitHubContentConfig | null {
  const owner = process.env.GITHUB_CONTENT_OWNER?.trim();
  const repository = process.env.GITHUB_CONTENT_REPOSITORY?.trim();
  const ref = process.env.GITHUB_CONTENT_REF?.trim() || "main";
  const token =
    process.env.GITHUB_CONTENT_TOKEN?.trim() ||
    process.env.GITHUB_READ_TOKEN?.trim();

  const hasPartialConfiguration = Boolean(
    owner || repository || process.env.GITHUB_CONTENT_REF?.trim() || token,
  );

  if (!hasPartialConfiguration) {
    return null;
  }

  if (!owner || !repository || !token) {
    throw new GitHubProjectSourceError(
      "Private portfolio content configuration is incomplete",
    );
  }

  const repositorySegmentPattern = /^[A-Za-z0-9_.-]+$/;
  const refPattern = /^[A-Za-z0-9._/-]+$/;

  if (
    !repositorySegmentPattern.test(owner) ||
    !repositorySegmentPattern.test(repository) ||
    !refPattern.test(ref) ||
    ref.includes("..") ||
    ref.startsWith("/") ||
    ref.endsWith("/")
  ) {
    throw new GitHubProjectSourceError(
      "Private portfolio content configuration is invalid",
    );
  }

  return {
    owner,
    repository,
    ref,
    token,
  };
}

function getGitHubHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "akb-studio",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function encodeRepositoryPath(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function githubFetch(
  config: GitHubContentConfig,
  path: string,
  tags: readonly string[],
): Promise<Response> {
  try {
    return await fetch(`${GITHUB_API_ORIGIN}${path}`, {
      headers: getGitHubHeaders(config.token),
      signal: AbortSignal.timeout(CONTENT_REQUEST_TIMEOUT_MS),
      redirect: "error",
      next: {
        revalidate: REVALIDATION_SECONDS,
        tags: [...tags],
      },
    });
  } catch (cause) {
    throw new GitHubProjectSourceError(
      "Portfolio content request failed or timed out",
      { cause },
    );
  }
}

function decodeGitHubContent(
  encodedContent: string,
  maximumBytes: number,
): string {
  const compactContent = encodedContent.replace(/\s/g, "");

  if (!compactContent || !/^[A-Za-z0-9+/]*={0,2}$/.test(compactContent)) {
    throw new GitHubProjectSourceError(
      "GitHub returned malformed base64 content",
    );
  }

  const decoded = Buffer.from(compactContent, "base64");

  if (decoded.byteLength > maximumBytes) {
    throw new GitHubProjectSourceError(
      `Portfolio content exceeds the ${maximumBytes}-byte limit`,
    );
  }

  return decoded
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");
}

async function fetchContentFile(
  config: GitHubContentConfig,
  path: string,
  maximumBytes: number,
  tags: readonly string[],
): Promise<string> {
  const encodedPath = encodeRepositoryPath(path);
  const endpoint = `/repos/${encodeURIComponent(
    config.owner,
  )}/${encodeURIComponent(
    config.repository,
  )}/contents/${encodedPath}?ref=${encodeURIComponent(config.ref)}`;

  const response = await githubFetch(config, endpoint, tags);

  if (!response.ok) {
    throw new GitHubProjectSourceError(
      "Portfolio content request was unsuccessful",
      {
        status: response.status,
      },
    );
  }

  const parsedFile = githubContentFileSchema.safeParse(await response.json());

  if (!parsedFile.success) {
    throw new GitHubProjectSourceError(
      "GitHub returned an unsupported content response",
      {
        cause: parsedFile.error,
      },
    );
  }

  if (parsedFile.data.size > maximumBytes) {
    throw new GitHubProjectSourceError(
      `Portfolio content exceeds the ${maximumBytes}-byte limit`,
    );
  }

  return decodeGitHubContent(parsedFile.data.content, maximumBytes);
}

async function loadManifest(
  config: GitHubContentConfig,
): Promise<z.infer<typeof projectContentManifestSchema>> {
  const source = await fetchContentFile(
    config,
    PORTFOLIO_MANIFEST_PATH,
    MAX_MANIFEST_BYTES,
    ["portfolio-content", "portfolio-manifest"],
  );

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(source);
  } catch (error) {
    throw new GitHubProjectSourceError(
      "Portfolio manifest contains invalid JSON",
      {
        cause: error,
      },
    );
  }

  const manifest = projectContentManifestSchema.safeParse(parsedJson);

  if (!manifest.success) {
    throw new GitHubProjectSourceError(
      "Portfolio manifest failed schema validation",
      {
        cause: manifest.error,
      },
    );
  }

  return manifest.data;
}

const getContentSource = cache(async () => {
  const config = getContentConfig();

  if (!config) {
    return null;
  }

  return { config, manifest: await loadManifest(config) };
});

export const getGitHubProjectRecords = cache(
  async (): Promise<ProjectRecord[] | null> => {
    const source = await getContentSource();

    if (!source) {
      return null;
    }

    return source.manifest.projects
      .filter((project) => project.publication === "published")
      .map(createProjectRecord)
      .sort((first, second) => first.order - second.order);
  },
);

function findAvailableLink(
  project: ProjectManifestEntry,
  kind: ProjectManifestEntry["links"][number]["kind"],
): string | undefined {
  const link = project.links.find(
    (candidate) => candidate.kind === kind && candidate.state === "available",
  );

  return link?.state === "available" ? link.href : undefined;
}

function createPublicRepository(
  project: ProjectManifestEntry,
): ProjectContentDocument["repository"] {
  if (!project.repository) {
    return {
      owner: "AKB Studio",
      name: project.slug,
      fullName: project.title,
      htmlUrl: "https://github.com/i-akb25",
      defaultBranch: "main",
      updatedAt: project.caseStudy.reviewedAt ?? "unreviewed",
      isAvailable: false,
    };
  }

  const htmlUrl =
    findAvailableLink(project, "repository") ??
    `https://github.com/${encodeURIComponent(
      project.repository.owner,
    )}/${encodeURIComponent(project.repository.name)}`;

  return {
    owner: project.repository.owner,
    name: project.repository.name,
    fullName: `${project.repository.owner}/${project.repository.name}`,
    htmlUrl,
    defaultBranch: "main",
    updatedAt: project.caseStudy.reviewedAt ?? "unreviewed",
    isAvailable: true,
  };
}

function createSafeContentRevision(slug: string, markdown: string): string {
  return createHash("sha256")
    .update(slug)
    .update("\0")
    .update(markdown)
    .digest("hex")
    .slice(0, 40);
}

function createProjectDocument(
  project: ProjectManifestEntry,
  markdown: string,
): ProjectContentDocument {
  const repository = createPublicRepository(project);
  const demoUrl = findAvailableLink(project, "demo");

  const parsedDocument = projectContentDocumentSchema.safeParse({
    frontmatter: {
      schemaVersion: 1,
      status: project.caseStudy.status,
      publication: project.publication,
      order: project.order,
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      categoryLabel: project.categoryLabel,
      tier: project.tier,
      lifecycle: project.lifecycle,
      disciplines: project.disciplines,
      ...(project.period
        ? {
            period: project.period,
          }
        : {}),
      role: project.role,
      ...(project.caseStudy.reviewedAt
        ? {
            publishedAt: project.caseStudy.reviewedAt,
            updatedAt: project.caseStudy.reviewedAt,
          }
        : {}),
      ...(project.homepageOrder !== undefined
        ? {
            homepageOrder: project.homepageOrder,
          }
        : {}),
      technologies: project.technologies.map((technology) => ({
        name: technology.name,
        icon: technology.icon,
        category: technologyCategoryByIcon[technology.icon],
      })),
      links: project.links,
      ...(demoUrl
        ? {
            demoUrl,
          }
        : {}),
      ...(project.cover
        ? {
            cover: {
              path: project.cover.src,
              src: project.cover.src,
              alt: project.cover.alt,
            },
          }
        : {}),
      metrics: project.metrics,
      systemFlow: project.systemFlow,
      visuals: project.visuals,
    },
    markdown,
    repository,
    source: {
      path: "curated-case-study",
      sha: createSafeContentRevision(project.slug, markdown),
      htmlUrl: repository.htmlUrl,
    },
  });

  if (!parsedDocument.success) {
    throw new GitHubProjectSourceError(
      `Project "${project.slug}" failed document validation`,
      {
        cause: parsedDocument.error,
      },
    );
  }

  return parsedDocument.data;
}

export const getGitHubProjectBySlug = cache(
  async (slug: string): Promise<ProjectContentDocument | null> => {
    const normalizedSlug = slug.trim().toLowerCase();

    if (
      normalizedSlug.length > 80 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)
    ) {
      return null;
    }

    const source = await getContentSource();

    if (!source) {
      return null;
    }

    const project = source.manifest.projects.find(
      (entry) =>
        entry.slug === normalizedSlug &&
        entry.publication === "published" &&
        entry.caseStudy.status === "published",
    );

    if (!project) {
      return null;
    }

    const markdown = await fetchContentFile(
      source.config,
      project.caseStudy.document,
      MAX_CASE_STUDY_BYTES,
      ["portfolio-content", `portfolio-project:${project.slug}`],
    );

    return createProjectDocument(project, markdown.trim());
  },
);
