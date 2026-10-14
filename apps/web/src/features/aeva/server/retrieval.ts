import "server-only";

import { createHash } from "node:crypto";
import { getPortfolioKnowledgeGraph } from "@/features/intelligence/server/portfolio-knowledge-graph";
import { prisma } from "@/server/db/prisma";
import { aevaServerConfig } from "../config/server-config";
import {
  chunkMemory,
  isEmploymentQuestion,
  memoryRelevance,
} from "../core/memory-retrieval";
import { rankRetrievalCandidate } from "../core/retrieval-ranking";
import type { AevaCitation, AevaQueryPlan } from "../model";
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

function contentHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
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
  return graph.nodes
    .filter((node) => node.document)
    .filter(
      (node) =>
        !isEmploymentQuestion(question) ||
        node.id.startsWith("profile:experience:"),
    )
    .flatMap((node) => {
      return chunkMemory(node.body).flatMap((chunk, index) => {
        const item = approvedCandidate({
          id: `${node.id}:chunk:${index + 1}`,
          title: node.title,
          url: node.url ?? "",
          kind: "portfolio",
          content: chunk,
          score: memoryRelevance(question, node.title, chunk),
          provenance: {
            sourceId: node.provenance?.sourceId ?? node.id,
            route: node.url ?? "",
            sourceType: "portfolio",
            classification: "public",
            allowedConsumers: ["public_aeva", "private_aeva"],
            authority: "canonical",
            published: true,
            allowAeva: true,
            sensitivity: "public",
            ...(node.provenance?.updatedAt
              ? { updatedAt: node.provenance.updatedAt }
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
    return [
      ...memories
        .filter((item) => !containsEmbeddedInstruction(item.content))
        .flatMap((item) =>
          chunkMemory(item.content).flatMap((chunk, index) => {
            const candidate = approvedCandidate({
              id: `memory:${item.id}:chunk:${index + 1}`,
              title: item.title,
              url: item.sourceUrl ?? "",
              kind: "memory",
              content: chunk,
              score: memoryRelevance(question, item.title, chunk),
              provenance: {
                sourceId: `memory:${item.id}`,
                route: item.sourceUrl ?? "",
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
        return chunkMemory(text).flatMap((chunk, index) => {
          const candidate = approvedCandidate({
            id: `owner-url:${item.id}:chunk:${index + 1}`,
            title: item.title,
            url: item.url,
            kind: "owner-url",
            content: chunk,
            score: memoryRelevance(question, item.title, chunk),
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

export function deduplicateAevaCitations(
  citations: readonly AevaCitation[],
): AevaCitation[] {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key =
      citation.kind === "memory"
        ? (citation.sourceId ?? citation.id)
        : `${citation.kind}:${citation.url.split("#", 1)[0]}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function retrieveAevaContext(
  query: string | AevaQueryPlan,
  requestedLimit?: number,
) {
  const question = typeof query === "string" ? query : query.originalQuestion;
  const plan = typeof query === "string" ? undefined : query;
  const limit = Math.min(
    requestedLimit ?? aevaServerConfig.maxRetrievalChunks,
    aevaServerConfig.maxRetrievalChunks,
  );
  const combined = [
    ...(await portfolioCandidates(question)),
    ...(await managedCandidates(question)),
  ];
  const seen = new Set<string>();
  const perSource = new Map<string, number>();
  return combined
    .map((item) => {
      const score = rankRetrievalCandidate(
        {
          title: item.title,
          content: item.content,
          score: item.score,
          updatedAt: item.updatedAt,
          authority: item.provenance.authority,
        },
        plan,
      );
      return score === null ? null : { ...item, score };
    })
    .filter((item): item is RetrievalCandidate => item !== null)
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id),
    )
    .filter((item) => {
      if (seen.has(item.provenance.contentHash)) return false;
      const sourceCount = perSource.get(item.provenance.sourceId) ?? 0;
      const sourceLimit = plan?.responseShape === "comparison" ? 1 : 2;
      if (sourceCount >= sourceLimit) return false;
      seen.add(item.provenance.contentHash);
      perSource.set(item.provenance.sourceId, sourceCount + 1);
      return true;
    })
    .slice(0, limit);
}
