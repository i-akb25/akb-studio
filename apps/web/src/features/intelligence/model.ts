export const KNOWLEDGE_DOCUMENT_KINDS = [
  "profile",
  "project",
  "journal",
  "knowledge",
  "pravaah",
] as const;

export const KNOWLEDGE_CONCEPT_KINDS = [
  "discipline",
  "technology",
  "topic",
  "tag",
] as const;

export type KnowledgeDocumentKind = (typeof KNOWLEDGE_DOCUMENT_KINDS)[number];
export type KnowledgeConceptKind = (typeof KNOWLEDGE_CONCEPT_KINDS)[number];
export type KnowledgeNodeKind = KnowledgeDocumentKind | KnowledgeConceptKind;

export type KnowledgeFacet = {
  kind: KnowledgeConceptKind;
  value: string;
};

export type KnowledgeRelation = {
  targetId: string;
  type: "relates-to" | "references" | "extends";
};

export type KnowledgeDocument = {
  id: string;
  kind: KnowledgeDocumentKind;
  title: string;
  summary: string;
  url: string;
  body: string;
  facets: readonly KnowledgeFacet[];
  relations: readonly KnowledgeRelation[];
  provenance: {
    owner: "akb-studio" | "akb-knowledge-content";
    sourceId: string;
    updatedAt?: string;
  };
};

export type KnowledgeGraphNode = {
  id: string;
  kind: KnowledgeNodeKind;
  title: string;
  body: string;
  url?: string;
  document: boolean;
  provenance?: KnowledgeDocument["provenance"];
};

export type KnowledgeGraphEdge = {
  id: string;
  from: string;
  to: string;
  type: "has-facet" | KnowledgeRelation["type"];
  weight: number;
};

export type PortfolioKnowledgeGraph = {
  schemaVersion: 1;
  nodes: readonly KnowledgeGraphNode[];
  edges: readonly KnowledgeGraphEdge[];
};

export type KnowledgeGraphMatch = {
  node: KnowledgeGraphNode;
  score: number;
  matchedTerms: readonly string[];
  relatedNodeIds: readonly string[];
};

const STOP_WORDS = new Set([
  "about",
  "and",
  "are",
  "for",
  "from",
  "how",
  "into",
  "the",
  "this",
  "what",
  "which",
  "with",
]);

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-IN")
    .replace(/[^a-z0-9+#.-]+/g, " ")
    .trim();
}

function terms(value: string): string[] {
  return [
    ...new Set(
      normalize(value)
        .split(/\s+/)
        .filter((term) => term.length >= 2 && !STOP_WORDS.has(term)),
    ),
  ];
}

function conceptId(kind: KnowledgeConceptKind, value: string): string {
  const slug = normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${kind}:${slug}`;
}

function edgeId(from: string, type: KnowledgeGraphEdge["type"], to: string) {
  return `${from}|${type}|${to}`;
}

export function createPortfolioKnowledgeGraph(
  documents: readonly KnowledgeDocument[],
): PortfolioKnowledgeGraph {
  const nodes = new Map<string, KnowledgeGraphNode>();
  const edges = new Map<string, KnowledgeGraphEdge>();
  const uniqueDocuments = new Map<string, KnowledgeDocument>();

  for (const document of documents) {
    if (uniqueDocuments.has(document.id)) continue;
    uniqueDocuments.set(document.id, document);
    nodes.set(document.id, {
      id: document.id,
      kind: document.kind,
      title: document.title,
      body: [document.summary, document.body].filter(Boolean).join(" "),
      url: document.url,
      document: true,
      provenance: document.provenance,
    });
  }

  for (const document of uniqueDocuments.values()) {
    for (const facet of document.facets) {
      const value = facet.value.trim();
      if (!value) continue;
      const id = conceptId(facet.kind, value);
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          kind: facet.kind,
          title: value,
          body: value,
          document: false,
        });
      }
      const idForEdge = edgeId(document.id, "has-facet", id);
      edges.set(idForEdge, {
        id: idForEdge,
        from: document.id,
        to: id,
        type: "has-facet",
        weight: facet.kind === "technology" ? 5 : 4,
      });
    }

    for (const relation of document.relations) {
      if (!nodes.has(relation.targetId) || relation.targetId === document.id) {
        continue;
      }
      const id = edgeId(document.id, relation.type, relation.targetId);
      edges.set(id, {
        id,
        from: document.id,
        to: relation.targetId,
        type: relation.type,
        weight: relation.type === "references" ? 7 : 6,
      });
    }
  }

  return {
    schemaVersion: 1,
    nodes: [...nodes.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    edges: [...edges.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  };
}

function lexicalScore(
  queryTerms: readonly string[],
  node: KnowledgeGraphNode,
): { score: number; matched: string[] } {
  const title = terms(node.title);
  const body = terms(node.body);
  const matched: string[] = [];
  let score = 0;

  for (const term of queryTerms) {
    const matches = (candidate: string) =>
      candidate === term ||
      (term.length >= 4 && candidate.startsWith(term)) ||
      (candidate.length >= 4 && term.startsWith(candidate));
    const titleMatch = title.some(matches);
    const bodyMatch = body.some(matches);
    if (!titleMatch && !bodyMatch) continue;
    matched.push(term);
    score += titleMatch ? 12 : 0;
    score += bodyMatch ? 3 : 0;
  }

  return { score, matched };
}

export function searchPortfolioKnowledgeGraph(
  graph: PortfolioKnowledgeGraph,
  query: string,
  limit = 6,
): KnowledgeGraphMatch[] {
  const queryTerms = terms(query);
  if (!queryTerms.length || limit < 1) return [];

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const direct = new Map(
    graph.nodes.map((node) => [node.id, lexicalScore(queryTerms, node)]),
  );
  const connected = new Map<string, Map<string, number>>();

  for (const edge of graph.edges) {
    const left = connected.get(edge.from) ?? new Map<string, number>();
    left.set(edge.to, Math.max(left.get(edge.to) ?? 0, edge.weight));
    connected.set(edge.from, left);
    const right = connected.get(edge.to) ?? new Map<string, number>();
    right.set(edge.from, Math.max(right.get(edge.from) ?? 0, edge.weight));
    connected.set(edge.to, right);
  }

  return graph.nodes
    .filter((node) => node.document && node.url)
    .map((node) => {
      const own = direct.get(node.id) ?? { score: 0, matched: [] };
      const relatedNodes = [
        ...(connected.get(node.id) ?? new Map<string, number>()),
      ];
      const relatedNodeIds = relatedNodes.map(([id]) => id);
      const relatedMatches = relatedNodeIds
        .map((id) => ({ id, match: direct.get(id) }))
        .filter(
          (
            item,
          ): item is {
            id: string;
            match: { score: number; matched: string[] };
          } => Boolean(item.match?.score),
        );
      const relationScore = relatedMatches.reduce(
        (total, item) =>
          total +
          Math.min(item.match.score, connected.get(node.id)?.get(item.id) ?? 0),
        0,
      );
      const matchedTerms = [
        ...new Set([
          ...own.matched,
          ...relatedMatches.flatMap((item) => item.match.matched),
        ]),
      ];

      return {
        node,
        score: own.score + relationScore,
        matchedTerms,
        relatedNodeIds: relatedNodeIds.filter((id) => nodeById.has(id)),
      } satisfies KnowledgeGraphMatch;
    })
    .filter((match) => match.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.node.id.localeCompare(right.node.id),
    )
    .slice(0, limit);
}
