import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyAevaIntent,
  conversationalReply,
  pageHighlights,
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
  assert.deepEqual(pageHighlights("explain-page", context), ["architecture"]);
  assert.equal(retrievalQuery("Hello", "conversation", context), "Hello");
});
