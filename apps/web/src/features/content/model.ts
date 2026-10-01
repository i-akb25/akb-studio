export const CONTENT_DISCIPLINES = [
  "software",
  "ai",
  "electrical",
  "automation",
  "embedded-systems",
  "robotics",
] as const;

export const KNOWLEDGE_KINDS = [
  "note",
  "research",
  "reading",
  "roadmap",
  "reflection",
] as const;

export type ContentDiscipline = (typeof CONTENT_DISCIPLINES)[number];
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number];
export type PublicationState = "draft" | "published" | "archived";

export type ContentSource = {
  type:
    | "original"
    | "project"
    | "paper"
    | "book"
    | "documentation"
    | "dataset"
    | "website"
    | "mixed";
  label: string;
  url?: string;
};

export type ContentImage = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type ContentAttachment = {
  id: string;
  kind:
    | "image"
    | "video"
    | "pdf"
    | "presentation"
    | "document"
    | "audio"
    | "archive";
  title: string;
  description?: string;
  storage: "github" | "google-drive" | "external";
  source?: ContentSource;
  fileId?: string;
  url?: string;
  mimeType?: string;
  sizeBytes?: number;
  thumbnail?: string;
  alt?: string;
};

export type ContentRelation = {
  type: "project" | "journal" | "knowledge";
  slug: string;
  label?: string;
};

export type BaseContentRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: PublicationState;
  publishedAt: string;
  updatedAt?: string;
  version?: string;
  disciplines: ContentDiscipline[];
  topics: string[];
  tags: string[];
  series?: string;
  cover?: ContentImage;
  source: ContentSource;
  references?: ContentSource[];
  diagrams?: ContentImage[];
  attachments: ContentAttachment[];
  relations: ContentRelation[];
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
};

export type JournalRecord = BaseContentRecord & {
  kind: "journal";
  canonicalPath: `/journal/${string}`;
  readingMinutes: number;
  body: string;
};

export type KnowledgeRecord = BaseContentRecord & {
  kind: KnowledgeKind;
  canonicalPath:
    | `/knowledge/${string}/${string}`
    | `/knowledge/reflections/${string}`;
  body: string;
};

export type PublishedContentRecord = JournalRecord | KnowledgeRecord;

export type JournalSummary = Omit<JournalRecord, "body">;
export type KnowledgeSummary = Omit<KnowledgeRecord, "body">;
export type PublishedContentSummary = JournalSummary | KnowledgeSummary;

export type ContentFilters = {
  query?: string;
  discipline?: ContentDiscipline;
  knowledgeKind?: KnowledgeKind;
};

export function formatDiscipline(value: ContentDiscipline): string {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseContentDiscipline(
  value: string | undefined,
): ContentDiscipline | undefined {
  return CONTENT_DISCIPLINES.find((discipline) => discipline === value);
}

export function parseKnowledgeKind(
  value: string | undefined,
): KnowledgeKind | undefined {
  return KNOWLEDGE_KINDS.find((kind) => kind === value);
}

export function readingTimeFromMarkdown(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

export function knowledgeRouteKind(kind: KnowledgeKind): string {
  if (kind === "note") return "notes";
  if (kind === "roadmap") return "roadmaps";
  if (kind === "reflection") return "reflections";
  return kind;
}

export function matchesContentFilters(
  record: PublishedContentSummary,
  filters: ContentFilters,
): boolean {
  if (filters.discipline && !record.disciplines.includes(filters.discipline)) {
    return false;
  }

  if (
    filters.knowledgeKind &&
    record.kind !== "journal" &&
    record.kind !== filters.knowledgeKind
  ) {
    return false;
  }

  const query = filters.query?.trim().toLocaleLowerCase("en-IN");

  if (!query) return true;

  const searchable = [
    record.title,
    record.description,
    record.source.label,
    record.series ?? "",
    ...record.disciplines,
    ...record.topics,
    ...record.tags,
  ]
    .join(" ")
    .toLocaleLowerCase("en-IN");

  return searchable.includes(query);
}
