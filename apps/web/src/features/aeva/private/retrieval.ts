import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "@/server/db/prisma";
import {
  type AevaProvenance,
  canConsumerRetrieve,
  containsEmbeddedInstruction,
} from "../security/classification";

export type PrivateAevaCandidate = {
  id: string;
  title: string;
  content: string;
  sourceLabel?: string;
  sourceUrl?: string;
  score: number;
  provenance: AevaProvenance;
};

function tokens(value: string): string[] {
  return [
    ...new Set(
      value.toLocaleLowerCase("en-IN").match(/[a-z0-9+#.-]{2,}/g) ?? [],
    ),
  ];
}

function score(query: readonly string[], title: string, content: string) {
  const heading = title.toLocaleLowerCase("en-IN");
  const body = content.toLocaleLowerCase("en-IN");
  return query.reduce(
    (total, token) =>
      total +
      (heading.includes(token) ? 8 : 0) +
      (body.includes(token) ? 2 : 0),
    0,
  );
}

function candidate(input: {
  id: string;
  title: string;
  content: string;
  sourceLabel?: string | null;
  sourceUrl?: string | null;
  updatedAt: Date;
  sourceType: "managed_memory" | "owner_url";
  route: string;
  score: number;
}): PrivateAevaCandidate | null {
  if (containsEmbeddedInstruction(input.content)) return null;
  const contentHash = createHash("sha256").update(input.content).digest("hex");
  const provenance: AevaProvenance = {
    sourceId: input.id,
    route: input.route,
    sourceType: input.sourceType,
    classification: "owner_private",
    allowedConsumers: ["private_aeva"],
    authority:
      input.sourceType === "managed_memory" ? "canonical" : "supporting",
    published: true,
    allowAeva: true,
    sensitivity: "private",
    updatedAt: input.updatedAt.toISOString(),
    contentHash,
  };
  if (!canConsumerRetrieve(provenance, "private_aeva")) return null;
  return {
    id: input.id,
    title: input.title,
    content: input.content,
    ...(input.sourceLabel ? { sourceLabel: input.sourceLabel } : {}),
    ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
    score: input.score,
    provenance,
  };
}

export async function retrievePrivateAevaContext(
  question: string,
  limit = 6,
): Promise<PrivateAevaCandidate[]> {
  const query = tokens(question);
  if (!query.length || !process.env.DATABASE_URL) return [];
  const [memories, sources] = await Promise.all([
    prisma.aevaMemory.findMany({
      where: { visibility: "OWNER_ONLY", state: "PUBLISHED" },
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.aevaSource.findMany({
      where: { enabled: true, publicAllowed: false },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);
  return [
    ...memories.flatMap((item) => {
      const ranked = score(query, item.title, item.content);
      if (ranked <= 0) return [];
      const result = candidate({
        id: `private-memory:${item.id}`,
        title: item.title,
        content: item.content.slice(0, 4_000),
        sourceLabel: item.sourceLabel,
        sourceUrl: item.sourceUrl,
        updatedAt: item.updatedAt,
        sourceType: "managed_memory",
        route: item.sourceUrl ?? "/admin/aeva",
        score: ranked,
      });
      return result ? [result] : [];
    }),
    ...sources.flatMap((item) => {
      const content = item.notes?.trim();
      if (!content) return [];
      const ranked = score(query, item.title, content);
      if (ranked <= 0) return [];
      const result = candidate({
        id: `private-source:${item.id}`,
        title: item.title,
        content: content.slice(0, 4_000),
        sourceLabel: item.title,
        sourceUrl: item.url,
        updatedAt: item.updatedAt,
        sourceType: "owner_url",
        route: item.url,
        score: ranked,
      });
      return result ? [result] : [];
    }),
  ]
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id),
    )
    .slice(0, Math.max(1, Math.min(6, limit)));
}
