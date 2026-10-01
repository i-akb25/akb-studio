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
  type ContentManifest,
  getContentManifest,
} from "@/features/content/server/content-source";

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

function repositoryUrl(path: string): string {
  return (
    `https://api.github.com/repos/${encodeURIComponent(OWNER)}/` +
    `${encodeURIComponent(REPO)}/contents/${path}`
  );
}

async function sha(path: string): Promise<string | null> {
  const response = await fetch(
    `${repositoryUrl(path)}?ref=${encodeURIComponent(REF)}`,
    { headers: headers(), cache: "no-store" },
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub lookup failed: ${response.status}`);

  return ((await response.json()) as { sha?: string }).sha ?? null;
}

async function put(path: string, content: string, message: string) {
  const current = await sha(path);
  const response = await fetch(repositoryUrl(path), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: REF,
      ...(current ? { sha: current } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub publish failed: ${response.status}`);
  }
}

export async function publishEditorial(input: PublishInput) {
  const manifest = await getContentManifest();
  const now = new Date().toISOString();
  const id = `${input.kind}_${input.slug}`;
  const document =
    input.kind === "journal"
      ? `content/journal/${input.slug}.md`
      : `content/knowledge/${knowledgeRouteKind(input.knowledgeKind)}/${input.slug}.md`;

  await put(document, input.body, `Publish ${input.title}`);

  let attachments: ContentAttachment[] = [];
  if (input.attachments) {
    const parsed: unknown = JSON.parse(input.attachments);
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
  const common = {
    id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    status: "published" as const,
    publishedAt: now,
    disciplines: input.disciplines,
    topics: input.topics,
    tags: input.tags,
    source,
    attachments,
    relations: [],
    document,
  };
  const next: ContentManifest = structuredClone(manifest);
  let canonicalPath: string;

  if (input.kind === "journal") {
    canonicalPath = `/journal/${input.slug}`;
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
    canonicalPath = `/knowledge/${knowledgeRouteKind(input.knowledgeKind)}/${input.slug}`;
    next.knowledge = [
      {
        ...common,
        kind: input.knowledgeKind,
        canonicalPath: canonicalPath as `/knowledge/${string}/${string}`,
      },
      ...next.knowledge.filter((item) => item.id !== id),
    ];
  }

  await put(
    "content/content-manifest.json",
    `${JSON.stringify(next, null, 2)}\n`,
    `Update manifest for ${input.title}`,
  );
  revalidateTag("akb-knowledge-content", "max");

  return { id, publishedAt: now, canonicalPath };
}
