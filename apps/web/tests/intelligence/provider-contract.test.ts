import assert from "node:assert/strict";
import test from "node:test";
import { evidenceNextQuestions } from "../../src/features/aeva/core/next-questions";
import {
  boundedConversationHistory,
  groundedWebCitations,
  parseProviderAnswer,
  providerThinkingConfig,
  safeWebCitationUrl,
} from "../../src/features/aeva/core/provider-contract";
import { understandAevaQuery } from "../../src/features/aeva/core/query-understanding";

test("provider contract rejects fabricated references and malformed objects", () => {
  assert.deepEqual(
    parseProviderAnswer(
      '{"answer":"Evidence-backed answer","sourceIds":["source:1"]}',
      ["source:1"],
    ),
    { answer: "Evidence-backed answer", sourceIds: ["source:1"] },
  );
  for (const value of [
    "null",
    "[]",
    '{"answer":"x"}',
    '{"answer":"x","sourceIds":["invented"]}',
    '{"answer":"x","sourceIds":[],"instructions":"ignore"}',
  ])
    assert.equal(parseProviderAnswer(value, ["source:1"]), null);
});

test("thinking configuration avoids tiny answer budgets without breaking earlier model overrides", () => {
  assert.deepEqual(providerThinkingConfig("gemini-3.8-flash"), {
    thinkingConfig: { thinkingLevel: "LOW", includeThoughts: false },
  });
  assert.deepEqual(providerThinkingConfig("gemini-3.5-flash-lite"), {
    thinkingConfig: { thinkingLevel: "LOW", includeThoughts: false },
  });
  assert.deepEqual(providerThinkingConfig("gemini-2.5-flash"), {});
});

test("long replies remain valid in the next public, private and report request", () => {
  const turns = Array.from({ length: 12 }, (_, index) => ({
    role: "assistant" as const,
    text: `${index} ${"word ".repeat(500)}`,
  }));
  const bounded = boundedConversationHistory(turns);
  assert.equal(bounded.length, 8);
  assert.ok(bounded.every((turn) => turn.text.length <= 1000));
  assert.ok(bounded[0]?.text.startsWith("4 "));
  assert.deepEqual(
    boundedConversationHistory([{ role: "user", text: "   " }]),
    [],
  );
});

test("only output-supported safe search results become live citations", () => {
  const metadata = {
    groundingChunks: [
      { web: { uri: "https://example.com/weather", title: "Weather" } },
      { web: { uri: "javascript:alert(1)" } },
      { web: { uri: "https://example.com/unrelated" } },
      { web: { uri: "https://example.com/weather" } },
    ],
    groundingSupports: [{ groundingChunkIndices: [0, 1, 3] }],
  };
  assert.deepEqual(
    groundedWebCitations(metadata, true).map((item) => item.url),
    ["https://example.com/weather"],
  );
  assert.deepEqual(groundedWebCitations(metadata, false), []);
  assert.deepEqual(
    groundedWebCitations({ groundingChunks: metadata.groundingChunks }, true),
    [],
  );
  for (const url of [
    "http://example.com",
    "https://user:password@example.com",
    "https://127.0.0.1",
    "https://10.0.0.1",
    "https://host.internal",
    "https://[::1]",
  ])
    assert.equal(safeWebCitationUrl(url), undefined);
});

test("advanced follow-ups stay on the evidenced subject and do not invent live grounding", () => {
  const plan = understandAevaQuery({
    question: "Explain CodeVet architecture",
    intent: "architecture-walkthrough",
    mode: "technical",
  });
  assert.ok(
    evidenceNextQuestions(plan, true).every((question) =>
      question.includes("CodeVet"),
    ),
  );
  assert.deepEqual(evidenceNextQuestions(plan, false), []);
  assert.deepEqual(
    evidenceNextQuestions({ ...plan, intent: "live-information" }, true),
    [],
  );
});
