import "server-only";

import { revalidateTag } from "next/cache";

import {
  type ContentAttachment,
  type ContentDiscipline,
  type ContentSource,
  type KnowledgeKind,
  knowledgeRouteKind,
  readingTimeFromMarkdown,
} from "@/features/content/model";
import {
  assertManifest,
  type ContentManifest,
} from "@/features/content/server/content-source";
import { publishGitHubFiles } from "./github-atomic-publish";

const OWNER = process.env.AKB_KNOWLEDGE_GITHUB_OWNER ?? "i-akb25";
const REPO = process.env.AKB_KNOWLEDGE_GITHUB_REPO ?? "akb-knowledge-content";
const REF = process.env.AKB_KNOWLEDGE_GITHUB_REF ?? "main";

type PublishInput = {
  kind: "journal" | "knowledge";
  knowledgeKind: KnowledgeKind;
  title: string;
  slug: string;
  description: string;
  sourceType: ContentSource["type"];
  sourceLabel: string;
  sourceUrl?: string;
  disciplines: ContentDiscipline[];
  topics: string[];
  tags: string[];
  body: string;
  attachments: string;
};

const ATTACHMENT_KINDS = new Set([
  "image",
  "video",
  "pdf",
  "presentation",
  "document",
  "audio",
  "archive",
]);
const ATTACHMENT_STORAGE = new Set(["github", "google-drive", "external"]);

function isContentAttachment(value: unknown): value is ContentAttachment {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.kind === "string" &&
    ATTACHMENT_KINDS.has(item.kind) &&
    typeof item.storage === "string" &&
    ATTACHMENT_STORAGE.has(item.storage)
  );
}

function token(): string {
  const value = process.env.AKB_KNOWLEDGE_GITHUB_WRITE_TOKEN?.trim();
  if (!value) throw new Error("Missing knowledge repository write token");
  return value;
}

function headers(): HeadersInit {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token()}`,
    "content-type": "application/json",
    "x-github-api-version": "2022-11-28",
  };
}

function repositoryUrl(): string {
  return (
    `https://api.github.com/repos/${encodeURIComponent(OWNER)}/` +
    `${encodeURIComponent(REPO)}`
  );
}

export async function publishEditorial(input: PublishInput) {
  const now = new Date().toISOString();
  const id = `${input.kind}_${input.slug}`;
  const document =
    input.kind === "journal"
      ? `content/journal/${input.slug}.md`
      : `content/knowledge/${knowledgeRouteKind(input.knowledgeKind)}/${input.slug}.md`;

  let attachments: ContentAttachment[] = [];
  if (input.attachments) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.attachments);
    } catch {
      throw new Error("Invalid attachments");
    }
    if (!Array.isArray(parsed) || !parsed.every(isContentAttachment)) {
      throw new Error("Invalid attachments");
    }
    attachments = parsed.slice(0, 20);
  }

  const source: ContentSource = {
    type: input.sourceType,
    label: input.sourceLabel,
    ...(input.sourceUrl ? { url: input.sourceUrl } : {}),
  };
  const canonicalPath =
    input.kind === "journal"
      ? `/journal/${input.slug}`
      : `/knowledge/${knowledgeRouteKind(input.knowledgeKind)}/${input.slug}`;
  await publishGitHubFiles({
    repositoryUrl: repositoryUrl(),
    ref: REF,
    headers: headers(),
    manifestPath: "content/content-manifest.json",
    message: `Publish ${input.title}`,
    buildFiles(raw) {
      let manifest: ContentManifest;
      try {
        const parsed: unknown =
          raw === null
            ? { version: 1, journal: [], knowledge: [] }
            : JSON.parse(raw);
        assertManifest(parsed);
        manifest = parsed;
      } catch {
        throw new Error(
          "Knowledge repository manifest is invalid. Existing records were not replaced.",
        );
      }
      const existing = [...manifest.journal, ...manifest.knowledge].find(
        (entry) => entry.id === id,
      );
      const common = {
        ...existing,
        id,
        slug: input.slug,
        title: input.title,
        description: input.description,
        status: "published" as const,
        publishedAt: existing?.publishedAt ?? now,
        updatedAt: now,
        disciplines: input.disciplines,
        topics: input.topics,
        tags: input.tags,
        source,
        attachments,
        relations: existing?.relations ?? [],
        document,
        ...(existing?.cover ? { cover: existing.cover } : {}),
        ...(existing?.seo ? { seo: existing.seo } : {}),
      };
      const next: ContentManifest = structuredClone(manifest);

      if (input.kind === "journal") {
        next.journal = [
          {
            ...common,
            kind: "journal",
            canonicalPath: canonicalPath as `/journal/${string}`,
            readingMinutes: readingTimeFromMarkdown(input.body),
          },
          ...next.journal.filter((item) => item.id !== id),
        ];
      } else {
        next.knowledge = [
          {
            ...common,
            kind: input.knowledgeKind,
            canonicalPath: canonicalPath as `/knowledge/${string}/${string}`,
          },
          ...next.knowledge.filter((item) => item.id !== id),
        ];
      }

      return [
        { path: document, content: input.body },
        {
          path: "content/content-manifest.json",
          content: `${JSON.stringify(next, null, 2)}\n`,
        },
      ];
    },
  });
  revalidateTag("akb-knowledge-content", "max");

  return { id, publishedAt: now, canonicalPath };
}
