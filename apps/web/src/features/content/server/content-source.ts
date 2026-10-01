import "server-only";

import type {
  ContentDiscipline,
  JournalRecord,
  JournalSummary,
  KnowledgeKind,
  KnowledgeRecord,
  KnowledgeSummary,
  PublishedContentRecord,
  PublishedContentSummary,
} from "../model";
import { readingTimeFromMarkdown } from "../model";

const OWNER = process.env.AKB_KNOWLEDGE_GITHUB_OWNER ?? "i-akb25";
const REPO = process.env.AKB_KNOWLEDGE_GITHUB_REPO ?? "akb-knowledge-content";
const REF = process.env.AKB_KNOWLEDGE_GITHUB_REF ?? "main";
const TOKEN = process.env.AKB_KNOWLEDGE_GITHUB_TOKEN?.trim();
const CONTENT_BASE_URL = process.env.AKB_KNOWLEDGE_CONTENT_BASE_URL?.replace(
  /\/$/,
  "",
);

type RemoteJournal = Omit<JournalRecord, "body" | "readingMinutes"> & {
  document: string;
  readingMinutes?: number;
};

type RemoteKnowledge = Omit<KnowledgeRecord, "body"> & {
  document: string;
};

export type ContentManifest = {
  version: number;
  journal: RemoteJournal[];
  knowledge: RemoteKnowledge[];
};

const EMPTY_MANIFEST: ContentManifest = {
  version: 1,
  journal: [],
  knowledge: [],
};

function githubHeaders(): HeadersInit {
  return {
    accept: "application/vnd.github.raw+json",
    ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    "x-github-api-version": "2022-11-28",
  };
}

async function fetchRepoText(
  path: string,
  options?: { allowMissing?: boolean },
): Promise<string | null> {
  if (!/^[a-zA-Z0-9._/-]+$/.test(path) || path.includes("..")) {
    throw new Error("Unsafe content repository path");
  }

  const url = CONTENT_BASE_URL
    ? `${CONTENT_BASE_URL}/${path}`
    : `https://api.github.com/repos/${encodeURIComponent(OWNER)}/` +
      `${encodeURIComponent(REPO)}/contents/${path}?ref=${encodeURIComponent(REF)}`;

  const response = await fetch(url, {
    headers: CONTENT_BASE_URL ? undefined : githubHeaders(),
    signal: AbortSignal.timeout(5_000),
    next: { revalidate: 300, tags: ["akb-knowledge-content"] },
  });

  if (response.status === 404 && options?.allowMissing) {
    return null;
  }

  if (
    !CONTENT_BASE_URL &&
    (response.status === 401 || response.status === 403)
  ) {
    throw new Error("Knowledge repository authentication failed");
  }

  if (!response.ok) {
    throw new Error(`Knowledge repository request failed: ${response.status}`);
  }

  return response.text();
}

function isDiscipline(value: unknown): value is ContentDiscipline {
  return [
    "software",
    "ai",
    "electrical",
    "automation",
    "embedded-systems",
    "robotics",
  ].includes(String(value));
}

function isKnowledgeKind(value: unknown): value is KnowledgeKind {
  return ["note", "research", "reading", "roadmap", "reflection"].includes(
    String(value),
  );
}

function isSafeSource(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  if (typeof source.type !== "string" || typeof source.label !== "string") {
    return false;
  }
  if (source.url === undefined) return true;
  if (typeof source.url !== "string") return false;

  try {
    const url = new URL(source.url);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isSafeImage(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const image = value as Record<string, unknown>;
  return typeof image.src === "string" && typeof image.alt === "string";
}

function assertManifest(value: unknown): asserts value is ContentManifest {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid knowledge manifest");
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.version !== "number" ||
    !Array.isArray(candidate.journal) ||
    !Array.isArray(candidate.knowledge)
  ) {
    throw new Error("Invalid knowledge manifest contract");
  }

  for (const item of [...candidate.journal, ...candidate.knowledge]) {
    if (!item || typeof item !== "object") {
      throw new Error("Invalid content record");
    }

    const record = item as Record<string, unknown>;

    if (
      typeof record.id !== "string" ||
      typeof record.slug !== "string" ||
      typeof record.title !== "string" ||
      typeof record.description !== "string" ||
      typeof record.document !== "string" ||
      typeof record.publishedAt !== "string" ||
      !["draft", "published", "archived"].includes(String(record.status)) ||
      !Array.isArray(record.disciplines) ||
      !record.disciplines.every(isDiscipline) ||
      !Array.isArray(record.topics) ||
      !Array.isArray(record.tags) ||
      !Array.isArray(record.attachments) ||
      !Array.isArray(record.relations) ||
      !isSafeSource(record.source)
    ) {
      throw new Error("Invalid content record contract");
    }

    if (
      (record.version !== undefined && typeof record.version !== "string") ||
      (record.references !== undefined &&
        (!Array.isArray(record.references) ||
          !record.references.every(isSafeSource))) ||
      (record.diagrams !== undefined &&
        (!Array.isArray(record.diagrams) ||
          !record.diagrams.every(isSafeImage)))
    ) {
      throw new Error(
        "Invalid content version, reference, or diagram contract",
      );
    }

    if (
      "kind" in record &&
      record.kind !== "journal" &&
      !isKnowledgeKind(record.kind)
    ) {
      throw new Error("Invalid content kind");
    }

    if (
      record.kind === "journal" &&
      (typeof record.readingMinutes !== "number" || record.readingMinutes < 1)
    ) {
      throw new Error("Journal reading time is required");
    }
  }
}

export async function getContentManifest(): Promise<ContentManifest> {
  let raw: string | null;
  try {
    raw = await fetchRepoText("content/content-manifest.json", {
      allowMissing: true,
    });
  } catch {
    return EMPTY_MANIFEST;
  }

  if (!raw) {
    return EMPTY_MANIFEST;
  }

  const parsed: unknown = JSON.parse(raw);
  assertManifest(parsed);
  return parsed;
}

function newestFirst<T extends { publishedAt: string }>(records: T[]): T[] {
  return [...records].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

async function hydrateJournal(entry: RemoteJournal): Promise<JournalRecord> {
  const body = await fetchRepoText(entry.document);

  if (!body) {
    throw new Error("Published Journal document is missing");
  }

  return {
    ...entry,
    body,
    readingMinutes: entry.readingMinutes ?? readingTimeFromMarkdown(body),
  };
}

async function hydrateKnowledge(
  entry: RemoteKnowledge,
): Promise<KnowledgeRecord> {
  const body = await fetchRepoText(entry.document);

  if (!body) {
    throw new Error("Published Knowledge document is missing");
  }

  return { ...entry, body };
}

function journalSummary(entry: RemoteJournal): JournalSummary {
  const { document: _document, ...record } = entry;

  return {
    ...record,
    readingMinutes: entry.readingMinutes ?? 1,
  };
}

function knowledgeSummary(entry: RemoteKnowledge): KnowledgeSummary {
  const { document: _document, ...record } = entry;
  return record;
}

export async function getPublishedJournal(): Promise<JournalSummary[]> {
  const manifest = await getContentManifest();
  return newestFirst(
    manifest.journal
      .filter((entry) => entry.status === "published")
      .map(journalSummary),
  );
}

export async function getJournalBySlug(
  slug: string,
): Promise<JournalRecord | null> {
  const manifest = await getContentManifest();
  const entry = manifest.journal.find(
    (item) => item.slug === slug && item.status === "published",
  );

  return entry ? hydrateJournal(entry) : null;
}

export async function getPublishedKnowledge(): Promise<KnowledgeSummary[]> {
  const manifest = await getContentManifest();
  return newestFirst(
    manifest.knowledge
      .filter((entry) => entry.status === "published")
      .map(knowledgeSummary),
  );
}

export async function getKnowledgeBySlug(
  kind: KnowledgeKind,
  slug: string,
): Promise<KnowledgeRecord | null> {
  const manifest = await getContentManifest();
  const entry = manifest.knowledge.find(
    (item) =>
      item.kind === kind && item.slug === slug && item.status === "published",
  );

  return entry ? hydrateKnowledge(entry) : null;
}

export async function getRelatedContent(
  source: PublishedContentRecord,
  limit = 4,
): Promise<PublishedContentSummary[]> {
  const [journal, knowledge] = await Promise.all([
    getPublishedJournal(),
    getPublishedKnowledge(),
  ]);

  const explicit = new Set(
    source.relations.map((relation) => `${relation.type}:${relation.slug}`),
  );

  return [...journal, ...knowledge]
    .filter((item) => item.id !== source.id)
    .map((item) => {
      const relationType = item.kind === "journal" ? "journal" : "knowledge";
      const explicitScore = explicit.has(`${relationType}:${item.slug}`)
        ? 100
        : 0;
      const disciplines = item.disciplines.filter((discipline) =>
        source.disciplines.includes(discipline),
      ).length;
      const topics = item.topics.filter((topic) =>
        source.topics.includes(topic),
      ).length;
      const series = source.series && source.series === item.series ? 8 : 0;

      return {
        item,
        score: explicitScore + disciplines * 12 + topics * 5 + series,
      };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.item.publishedAt).getTime() -
          new Date(a.item.publishedAt).getTime(),
    )
    .slice(0, limit)
    .map(({ item }) => item);
}
