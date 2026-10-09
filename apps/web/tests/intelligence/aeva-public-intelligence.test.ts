import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { groundedFallbackAnswer } from "../../src/features/aeva/core/grounded-answer";
import { understandAevaQuery } from "../../src/features/aeva/core/query-understanding";
import { rankRetrievalCandidate } from "../../src/features/aeva/core/retrieval-ranking";
import {
  createAevaActions,
  normalizeAevaPageContext,
} from "../../src/features/aeva/core/site-awareness";
import { classifyAevaIntent } from "../../src/features/aeva/intent";

test("understands skill, comparison and timeline questions", () => {
  assert.equal(
    classifyAevaIntent({
      question: "Where did he use React?",
      mode: "explore",
    }),
    "skill-evidence",
  );
  assert.equal(
    classifyAevaIntent({
      question: "What did Anurag build in 2024?",
      mode: "explore",
    }),
    "timeline",
  );
  const comparison = understandAevaQuery({
    question: "Compare CodeVet and ADHAYAN",
    intent: "compare-projects",
    mode: "technical",
  });
  assert.equal(comparison.responseShape, "comparison");
  assert.ok(comparison.entities.includes("CodeVet"));
  assert.ok(comparison.entities.includes("ADHAYAN"));
});

test("expands known entities and extracts requested technologies and years", () => {
  const plan = understandAevaQuery({
    question: "Where did Ace use TypeScript in 2025?",
    intent: "skill-evidence",
    mode: "explore",
  });
  assert.ok(plan.expandedQuery.includes("Anurag Kumar Bharti"));
  assert.deepEqual(plan.technologies, ["TypeScript"]);
  assert.deepEqual(plan.years, [2025]);
  assert.equal(plan.responseShape, "evidence-list");
});

test("deterministic grounded synthesis obeys its word budget", () => {
  const plan = understandAevaQuery({
    question: "Compare CodeVet and ADHAYAN",
    intent: "compare-projects",
    mode: "explore",
  });
  const answer = groundedFallbackAnswer({
    plan,
    maxWords: 24,
    sources: [
      {
        title: "CodeVet",
        content: "A detailed published software project description ".repeat(8),
      },
      {
        title: "ADHAYAN",
        content: "A detailed published learning project description ".repeat(8),
      },
    ],
  });
  assert.ok(answer.trim().split(/\s+/).length <= 24);
  assert.match(answer, /Published comparison evidence/);
});

test("authority and freshness reorder relevant evidence but never admit irrelevant evidence", () => {
  const irrelevant = rankRetrievalCandidate({
    title: "Unrelated canonical page",
    content: "No matching evidence",
    score: 0,
    authority: "canonical",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  const relevant = rankRetrievalCandidate(
    {
      title: "CodeVet",
      content: "A TypeScript code review project",
      score: 8,
      authority: "supporting",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
    undefined,
    Date.parse("2026-01-01T00:00:00.000Z"),
  );
  assert.equal(irrelevant, null);
  assert.ok((relevant ?? 0) > 8);
});

test("provider and feedback paths enforce evidence and independent quotas", async () => {
  const [provider, guard, feedback] = await Promise.all([
    readFile(
      path.resolve(
        import.meta.dirname,
        "../../src/features/aeva/server/provider.ts",
      ),
      "utf8",
    ),
    readFile(
      path.resolve(
        import.meta.dirname,
        "../../src/features/aeva/server/aeva-guard.ts",
      ),
      "utf8",
    ),
    readFile(
      path.resolve(import.meta.dirname, "../../src/app/api/feedback/route.ts"),
      "utf8",
    ),
  ]);
  assert.match(provider, /requiresEvidence && citations\.length === 0/);
  assert.match(provider, /usedWeb: webCitations\.length > 0/);
  assert.match(guard, /aeva:chat:address/);
  assert.match(guard, /aeva:feedback:address/);
  assert.match(feedback, /acceptAevaFeedbackRequest/);
});

test("site context rejects private routes and keeps allowlisted public routes", () => {
  assert.equal(
    normalizeAevaPageContext({ path: "/admin", title: "Admin" }),
    undefined,
  );
  assert.equal(
    normalizeAevaPageContext({ path: "https://example.com", title: "Other" }),
    undefined,
  );
  assert.equal(
    normalizeAevaPageContext({ path: "//example.com", title: "Other" }),
    undefined,
  );
  assert.deepEqual(
    normalizeAevaPageContext({
      path: "/projects/codevet",
      title: "CodeVet",
      sectionId: "architecture",
    }),
    {
      path: "/projects/codevet",
      title: "CodeVet",
      sectionId: "architecture",
    },
  );
});

test("site actions are deterministic, internal and user initiated", () => {
  const plan = understandAevaQuery({
    question: "Show me software projects and the resume",
    intent: "skill-evidence",
    mode: "explore",
  });
  const actions = createAevaActions({
    question: plan.originalQuestion,
    intent: plan.intent,
    citations: [
      {
        id: "internal",
        title: "CodeVet",
        url: "/projects/codevet",
        kind: "portfolio",
      },
      {
        id: "external",
        title: "Untrusted external action",
        url: "https://example.com/write",
        kind: "web",
      },
    ],
  });
  assert.ok(actions.some((item) => item.href === "/resume"));
  assert.ok(
    actions.some(
      (item) =>
        item.href === "/projects?discipline=software#project-archive-heading",
    ),
  );
  assert.ok(actions.every((item) => item.href.startsWith("/")));
  assert.ok(actions.every((item) => !item.href.includes("example.com")));
  assert.ok(actions.length <= 3);

  const sanitized = createAevaActions({
    question: "What evidence supports that?",
    intent: "skill-evidence",
    citations: [
      {
        id: "sanitized",
        title: "Projects",
        url: "/projects?redirect=https://example.com#project-archive-heading",
        kind: "portfolio",
      },
    ],
  });
  assert.equal(sanitized[0]?.href, "/projects#project-archive-heading");
});
