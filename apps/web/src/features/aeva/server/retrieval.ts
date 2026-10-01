import "server-only";

import { searchPortfolioKnowledgeGraph } from "@/features/intelligence/model";
import { getPortfolioKnowledgeGraph } from "@/features/intelligence/server/portfolio-knowledge-graph";
import { prisma } from "@/server/db/prisma";
import type { AevaCitation } from "../model";

export type RetrievalCandidate = AevaCitation & {
  content: string;
  score: number;
};

function tokens(value: string): string[] {
  return [
    ...new Set(value.toLocaleLowerCase("en-IN").match(/[a-z0-9]{2,}/g) ?? []),
  ];
}

function score(query: string[], title: string, content: string): number {
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

function candidate(
  input: Omit<RetrievalCandidate, "score">,
): RetrievalCandidate {
  return { ...input, score: 0 };
}

async function portfolioCandidates(
  question: string,
): Promise<RetrievalCandidate[]> {
  const graph = await getPortfolioKnowledgeGraph();
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));

  return searchPortfolioKnowledgeGraph(graph, question, 8).map((match) => {
    const related = match.relatedNodeIds
      .map((id) => nodes.get(id)?.title)
      .filter((title): title is string => Boolean(title));
    return {
      id: match.node.id,
      title: match.node.title,
      url: match.node.url ?? "/aeva",
      kind: "portfolio" as const,
      excerpt: match.node.body.slice(0, 240),
      ...(match.node.provenance?.updatedAt
        ? { updatedAt: match.node.provenance.updatedAt }
        : {}),
      content: [
        match.node.body,
        related.length ? `Related evidence: ${related.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      score: match.score,
    };
  });
}

async function managedCandidates(): Promise<RetrievalCandidate[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const [memories, sources] = await Promise.all([
      prisma.aevaMemory.findMany({
        where: {
          state: "PUBLISHED",
          visibility: "PUBLIC_AEVA",
        },
        orderBy: { order: "asc" },
      }),
      prisma.aevaSource.findMany({
        where: { enabled: true, publicAllowed: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    return [
      ...memories.map((item) =>
        candidate({
          id: `memory:${item.id}`,
          title: item.title,
          url: item.sourceUrl ?? "/aeva",
          kind: "memory" as const,
          excerpt: item.content.slice(0, 240),
          content: item.content,
          updatedAt: item.updatedAt.toISOString(),
        }),
      ),
      ...sources.map((item) =>
        candidate({
          id: `owner-url:${item.id}`,
          title: item.title,
          url: item.url,
          kind: "owner-url" as const,
          excerpt: item.notes?.slice(0, 240),
          content: item.notes ?? item.title,
          updatedAt: item.updatedAt.toISOString(),
        }),
      ),
    ];
  } catch {
    return [];
  }
}

export async function retrieveAevaContext(question: string) {
  const query = tokens(question);
  const graphCandidates = await portfolioCandidates(question);
  const managed = (await managedCandidates()).map((item) => ({
    ...item,
    score: score(query, item.title, item.content),
  }));

  return [...graphCandidates, ...managed]
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id),
    )
    .slice(0, 6);
}
