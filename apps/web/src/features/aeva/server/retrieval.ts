import "server-only";

import { createHash } from "node:crypto";
import { searchPortfolioKnowledgeGraph } from "@/features/intelligence/model";
import { getPortfolioKnowledgeGraph } from "@/features/intelligence/server/portfolio-knowledge-graph";
import { prisma } from "@/server/db/prisma";
import { aevaServerConfig } from "../config/server-config";
import type { AevaCitation } from "../model";
import {
  type AevaProvenance,
  canConsumerRetrieve,
  containsEmbeddedInstruction,
} from "../security/classification";

export type RetrievalCandidate = AevaCitation & {
  content: string;
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

function contentHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function lexicalScore(query: string[], title: string, content: string): number {
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

function chunks(value: string, maxCharacters = 720): string[] {
  const sentences = value
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const result: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > maxCharacters) {
      result.push(current);
      current = "";
    }
    if (sentence.length > maxCharacters) {
      if (current) result.push(current);
      result.push(sentence.slice(0, maxCharacters));
      current = "";
    } else {
      current = [current, sentence].filter(Boolean).join(" ");
    }
  }
  if (current) result.push(current);
  return result;
}

function approvedCandidate(input: {
  id: string;
  title: string;
  url: string;
  kind: AevaCitation["kind"];
  content: string;
  score: number;
  provenance: Omit<AevaProvenance, "contentHash">;
}): RetrievalCandidate | null {
  const hash = contentHash(input.content);
  const provenance = { ...input.provenance, contentHash: hash };
  if (!canConsumerRetrieve(provenance, "public_aeva")) return null;
  if (containsEmbeddedInstruction(input.content)) return null;
  return {
    id: input.id,
    title: input.title,
    url: input.url,
    kind: input.kind,
    excerpt: input.content.slice(0, 240),
    ...(provenance.updatedAt ? { updatedAt: provenance.updatedAt } : {}),
    sourceId: provenance.sourceId,
    contentHash: hash,
    content: input.content,
    score: input.score,
    provenance,
  };
}

async function portfolioCandidates(
  question: string,
): Promise<RetrievalCandidate[]> {
  const graph = await getPortfolioKnowledgeGraph();
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  return searchPortfolioKnowledgeGraph(graph, question, 10).flatMap((match) => {
    const related = match.relatedNodeIds
      .map((id) => nodes.get(id)?.title)
      .filter((title): title is string => Boolean(title));
    const text = [
      match.node.body,
      related.length ? `Related evidence: ${related.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return chunks(text).flatMap((chunk, index) => {
      const item = approvedCandidate({
        id: `${match.node.id}:chunk:${index + 1}`,
        title: match.node.title,
        url: match.node.url ?? "/aeva",
        kind: "portfolio",
        content: chunk,
        score:
          match.score + lexicalScore(tokens(question), match.node.title, chunk),
        provenance: {
          sourceId: match.node.provenance?.sourceId ?? match.node.id,
          route: match.node.url ?? "/aeva",
          sourceType: "portfolio",
          classification: "public",
          allowedConsumers: ["public_aeva", "private_aeva"],
          authority: "canonical",
          published: true,
          allowAeva: true,
          sensitivity: "public",
          ...(match.node.provenance?.updatedAt
            ? { updatedAt: match.node.provenance.updatedAt }
            : {}),
        },
      });
      return item ? [item] : [];
    });
  });
}

async function managedCandidates(
  question: string,
): Promise<RetrievalCandidate[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const [memories, sources] = await Promise.all([
      prisma.aevaMemory.findMany({
        where: { state: "PUBLISHED", visibility: "PUBLIC_AEVA" },
        orderBy: { order: "asc" },
      }),
      prisma.aevaSource.findMany({
        where: { enabled: true, publicAllowed: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    const query = tokens(question);
    return [
      ...memories.flatMap((item) =>
        chunks(item.content).flatMap((chunk, index) => {
          const candidate = approvedCandidate({
            id: `memory:${item.id}:chunk:${index + 1}`,
            title: item.title,
            url: item.sourceUrl ?? "/aeva",
            kind: "memory",
            content: chunk,
            score: lexicalScore(query, item.title, chunk),
            provenance: {
              sourceId: `memory:${item.id}`,
              route: item.sourceUrl ?? "/aeva",
              sourceType: "managed_memory",
              classification: "public",
              allowedConsumers: ["public_aeva", "private_aeva"],
              authority: "supporting",
              published: item.state === "PUBLISHED",
              allowAeva: item.visibility === "PUBLIC_AEVA",
              sensitivity: "public",
              updatedAt: item.updatedAt.toISOString(),
            },
          });
          return candidate ? [candidate] : [];
        }),
      ),
      ...sources.flatMap((item) => {
        const text = item.notes?.trim() || item.title;
        return chunks(text).flatMap((chunk, index) => {
          const candidate = approvedCandidate({
            id: `owner-url:${item.id}:chunk:${index + 1}`,
            title: item.title,
            url: item.url,
            kind: "owner-url",
            content: chunk,
            score: lexicalScore(query, item.title, chunk),
            provenance: {
              sourceId: `owner-url:${item.id}`,
              route: item.url,
              sourceType: "owner_url",
              classification: "public",
              allowedConsumers: ["public_aeva", "private_aeva"],
              authority: "contextual",
              published: item.enabled,
              allowAeva: item.publicAllowed,
              sensitivity: "public",
              updatedAt: item.updatedAt.toISOString(),
            },
          });
          return candidate ? [candidate] : [];
        });
      }),
    ];
  } catch {
    return [];
  }
}

export function citationFromCandidate(
  source: RetrievalCandidate,
): AevaCitation {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    kind: source.kind,
    ...(source.excerpt ? { excerpt: source.excerpt } : {}),
    ...(source.updatedAt ? { updatedAt: source.updatedAt } : {}),
    sourceId: source.provenance.sourceId,
    contentHash: source.provenance.contentHash,
  };
}

export async function retrieveAevaContext(
  question: string,
  requestedLimit?: number,
) {
  const limit = Math.min(
    requestedLimit ?? aevaServerConfig.maxRetrievalChunks,
    aevaServerConfig.maxRetrievalChunks,
  );
  const combined = [
    ...(await portfolioCandidates(question)),
    ...(await managedCandidates(question)),
  ];
  const seen = new Set<string>();
  return combined
    .filter((item) => item.score >= 4)
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id),
    )
    .filter((item) => {
      if (seen.has(item.provenance.contentHash)) return false;
      seen.add(item.provenance.contentHash);
      return true;
    })
    .slice(0, limit);
}
