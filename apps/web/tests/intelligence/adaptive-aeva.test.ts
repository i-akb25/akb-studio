import assert from "node:assert/strict";
import test from "node:test";
import { resolveFollowUpQuestion } from "../../src/features/aeva/core/response-contract";
import {
  classifyAevaIntent,
  conversationalReply,
  retrievalQuery,
} from "../../src/features/aeva/intent";

test("routes conversational, recruiter and live-information requests", () => {
  assert.equal(
    classifyAevaIntent({ question: "Hello", mode: "explore" }),
    "conversation",
  );
  assert.equal(
    classifyAevaIntent({
      question: "Please compare this job description with the portfolio",
      mode: "recruiter",
    }),
    "role-fit",
  );
  assert.equal(
    classifyAevaIntent({
      question: "What is the weather in Tokyo today?",
      mode: "explore",
    }),
    "live-information",
  );
  assert.equal(
    classifyAevaIntent({
      question: "What is Anurag doing today?",
      mode: "explore",
    }),
    "portfolio",
  );
});

test("keeps a visitor name only inside supplied session context", () => {
  const history = [{ role: "user" as const, text: "Hi, I am Aryan" }];
  assert.equal(
    conversationalReply("I am good", history),
    "Good to hear, Aryan. What brings you here today?",
  );
  assert.equal(
    conversationalReply("I am good", []),
    "Good to hear. What brings you here today?",
  );
});

test("keeps introductions and capability questions out of retrieval", () => {
  for (const question of [
    "hey how are you",
    "i am shivi",
    "what you do",
    "what can you do?",
  ]) {
    assert.equal(
      classifyAevaIntent({ question, mode: "explore", history: [] }),
      "conversation",
    );
    assert.ok(conversationalReply(question, []));
  }
  assert.match(
    conversationalReply("i am shivi", []) ?? "",
    /Hello Shivi, good to meet you/,
  );
  assert.match(
    conversationalReply("what you do", []) ?? "",
    /help visitors explore Anurag’s published projects/,
  );
});

test("adds page context only for explain-page requests", () => {
  const context = {
    path: "/projects/automated-drone-delivery",
    title: "Automated Drone Delivery",
    sectionId: "architecture",
    sectionLabel: "Architecture",
  };
  assert.match(
    retrievalQuery("Explain this page", "explain-page", context),
    /Automated Drone Delivery/,
  );
  assert.equal(retrievalQuery("Hello", "conversation", context), "Hello");
});

test("inherits the previous intent for a vague follow-up", () => {
  assert.equal(
    classifyAevaIntent({
      question: "Tell me more",
      mode: "explore",
      history: [
        { role: "user", text: "Explain the drone architecture" },
        { role: "assistant", text: "A short answer" },
      ],
    }),
    "architecture-walkthrough",
  );
});

test("uses a short location as clarification for a live-information question", () => {
  const history = [
    { role: "user" as const, text: "What is today's weather?" },
    {
      role: "assistant" as const,
      text: "Please provide a location and enable live web search.",
    },
  ];
  assert.equal(
    classifyAevaIntent({ question: "Patna", mode: "explore", history }),
    "live-information",
  );
  assert.equal(
    resolveFollowUpQuestion("Patna", history),
    "What is today's weather? Location clarification: Patna",
  );
  assert.equal(
    resolveFollowUpQuestion("Will it rain?", history),
    "Will it rain?",
  );
});
