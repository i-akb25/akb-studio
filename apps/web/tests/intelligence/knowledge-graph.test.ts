import assert from "node:assert/strict";
import test from "node:test";
import {
  createPortfolioKnowledgeGraph,
  type KnowledgeDocument,
  searchPortfolioKnowledgeGraph,
} from "../../src/features/intelligence/model";

const documents: KnowledgeDocument[] = [
  {
    id: "project:drone",
    kind: "project",
    title: "Automated Drone Delivery",
    summary: "A Pixhawk delivery aircraft with payload validation.",
    url: "/projects/drone",
    body: "Control engineering and autonomous flight.",
    facets: [
      { kind: "discipline", value: "Robotics" },
      { kind: "technology", value: "Pixhawk" },
    ],
    relations: [],
    provenance: { owner: "akb-studio", sourceId: "drone" },
  },
  {
    id: "knowledge:pid",
    kind: "knowledge",
    title: "PID control notes",
    summary: "Practical controller tuning observations.",
    url: "/knowledge/notes/pid",
    body: "Feedback response, overshoot and settling time.",
    facets: [
      { kind: "discipline", value: "Robotics" },
      { kind: "topic", value: "Control engineering" },
    ],
    relations: [
      { targetId: "project:drone", type: "references" },
      { targetId: "project:missing", type: "references" },
    ],
    provenance: { owner: "akb-knowledge-content", sourceId: "pid" },
  },
];

test("builds a deterministic graph without dangling relationships", () => {
  const graph = createPortfolioKnowledgeGraph(documents);

  assert.equal(graph.schemaVersion, 1);
  assert.equal(
    graph.nodes.filter((node) => node.id === "discipline:robotics").length,
    1,
  );
  assert.ok(
    graph.edges.some(
      (edge) => edge.from === "knowledge:pid" && edge.to === "project:drone",
    ),
  );
  assert.ok(!graph.edges.some((edge) => edge.to === "project:missing"));
});

test("ranks direct evidence ahead of merely related evidence", () => {
  const graph = createPortfolioKnowledgeGraph(documents);
  const matches = searchPortfolioKnowledgeGraph(graph, "Pixhawk drone", 4);

  assert.equal(matches[0]?.node.id, "project:drone");
  assert.ok((matches[0]?.score ?? 0) > 0);
  assert.ok(matches[0]?.matchedTerms.includes("pixhawk"));
});

test("uses shared concepts to retrieve related public documents", () => {
  const graph = createPortfolioKnowledgeGraph(documents);
  const matches = searchPortfolioKnowledgeGraph(graph, "robotics", 4);

  assert.deepEqual(
    new Set(matches.map((match) => match.node.id)),
    new Set(["project:drone", "knowledge:pid"]),
  );
});

test("uses explicit document relationships without overmatching short terms", () => {
  const graph = createPortfolioKnowledgeGraph(documents);
  const related = searchPortfolioKnowledgeGraph(graph, "drone", 4);
  const shortTerm = searchPortfolioKnowledgeGraph(graph, "ai", 4);

  assert.ok(related.some((match) => match.node.id === "knowledge:pid"));
  assert.deepEqual(shortTerm, []);
});

test("returns no evidence for empty or stop-word-only questions", () => {
  const graph = createPortfolioKnowledgeGraph(documents);

  assert.deepEqual(searchPortfolioKnowledgeGraph(graph, "what is this"), []);
  assert.deepEqual(searchPortfolioKnowledgeGraph(graph, "Pixhawk", 0), []);
});
