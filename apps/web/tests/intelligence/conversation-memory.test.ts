import assert from "node:assert/strict";
import test from "node:test";
import {
  citationHref,
  restoreChatSession,
} from "../../src/features/aeva/core/chat-session";
import {
  conversationClosing,
  earlierConversationSummary,
  selectConversationContext,
  visitorName,
} from "../../src/features/aeva/core/conversation-context";
import {
  approvedShortReply,
  groundedFallbackAnswer,
} from "../../src/features/aeva/core/grounded-answer";
import {
  chunkMemory,
  isEmploymentQuestion,
  memoryRelevance,
} from "../../src/features/aeva/core/memory-retrieval";
import { missingAnswer } from "../../src/features/aeva/core/missing-answer";
import { isSourceFragmentDump } from "../../src/features/aeva/core/provider-contract";
import { understandAevaQuery } from "../../src/features/aeva/core/query-understanding";
import { resolveFollowUpQuestion } from "../../src/features/aeva/core/response-contract";
import {
  classifyAevaIntent,
  conversationalReply,
} from "../../src/features/aeva/intent";
import type { AevaConversationTurn } from "../../src/features/aeva/model";

test("compound small talk stays conversational without replacing the visitor name", () => {
  const history: AevaConversationTurn[] = [
    { role: "user", text: "Hey Mira here" },
    { role: "user", text: "I am good" },
  ];
  assert.equal(visitorName(history), "Mira");
  for (const question of [
    "I am good what about you",
    "I'm fine, and you?",
    "what is my name?",
  ]) {
    assert.equal(
      classifyAevaIntent({ question, mode: "explore", history }),
      "conversation",
    );
    assert.match(conversationalReply(question, history) ?? "", /Mira/);
  }
  assert.equal(
    classifyAevaIntent({
      question: "Hello, what is today's weather?",
      mode: "explore",
    }),
    "live-information",
  );
});

test("new topics do not inherit a previous live-information route", () => {
  const history: AevaConversationTurn[] = [
    { role: "user", text: "What is the weather in Delhi?" },
  ];
  for (const question of [
    "His education",
    "His work experience",
    "Who is Mira?",
    "Is he married?",
  ])
    assert.notEqual(
      classifyAevaIntent({ question, mode: "explore", history }),
      "live-information",
    );
  assert.equal(
    classifyAevaIntent({
      question: "Is he going to be president",
      mode: "explore",
    }),
    "portfolio",
  );
  assert.equal(
    resolveFollowUpQuestion("His education", history),
    "His education",
  );
});

test("unrelated personal FAQs cannot answer an unknown named-person question", () => {
  for (const title of [
    "Who is Anurag’s best friend?",
    "Who is closest to Anurag?",
    "Who is Anurag going to marry?",
  ])
    assert.equal(
      memoryRelevance("Who is Mira?", title, "Only Anurag can confirm that."),
      0,
    );
  assert.equal(
    memoryRelevance("is he", "Published career", "This is a project."),
    0,
  );
  assert.equal(memoryRelevance("art", "A startup", "A smart design."), 0);
  assert.match(missingAnswer("Who is Mira?").answer, /^Which Mira/);
  assert.equal(missingAnswer("Who is Mira?").actions.length, 0);
});

test("employment evidence outranks a software project for work experience", () => {
  assert.equal(isEmploymentQuestion("His work experience"), true);
  assert.equal(isEmploymentQuestion("Where did he use React?"), false);
  const career = memoryRelevance(
    "His work experience",
    "Experience: Example Steel",
    "Graduate Engineer Trainee in electrical automation.",
  );
  const project = memoryRelevance(
    "His work experience",
    "Example app",
    "Anurag's software work includes a learning app.",
  );
  assert.ok(career > project);
  assert.ok(
    memoryRelevance(
      "His employment",
      "Example Steel",
      "He worked as a trainee.",
    ) > 0,
  );
  assert.ok(
    memoryRelevance(
      "Is he married?",
      "Is Anurag married?",
      "He hasn’t shared a public update.",
    ) > 0,
  );
});

test("long paragraph tails survive and can be retrieved", () => {
  const value = `${"Engineering examples without punctuation ".repeat(70)} specialized turbine commissioning evidence`;
  const chunks = chunkMemory(value);
  assert.equal(chunks.join(" "), value.trim().replace(/\s+/g, " "));
  const scores = chunks.map((content) =>
    memoryRelevance("turbine commissioning", "Experience", content),
  );
  assert.ok((scores.at(-1) ?? 0) > 0);
  assert.equal(scores[0], 0);
});

test("older relevant exchanges and the visitor introduction survive long chats", () => {
  const history: AevaConversationTurn[] = [
    { role: "user", text: "Hello Mira here" },
    { role: "assistant", text: "Hello Mira" },
    { role: "user", text: "Tell me about turbine commissioning" },
    { role: "assistant", text: "We discussed the commissioning example." },
  ];
  for (let i = 0; i < 70; i++)
    history.push({
      role: i % 2 ? "assistant" : "user",
      text: `Unrelated exchange ${i}`,
    });
  const context = selectConversationContext(
    history,
    "Back to turbine commissioning",
  );
  assert.ok(context.length <= 24);
  assert.equal(visitorName(context), "Mira");
  assert.ok(context.some((turn) => turn.text.includes("We discussed")));
  assert.equal(context.at(-1)?.text, history.at(-1)?.text);
  assert.match(
    conversationClosing(context),
    /Thanks for chatting with me, Mira/,
  );
  assert.doesNotMatch(conversationClosing([]), /Mira/);
});

test("follow-ups carry the previous user subject without adopting visitor claims as evidence", () => {
  const resolved = resolveFollowUpQuestion("What did he do there?", [
    { role: "user", text: "Example Steel" },
  ]);
  assert.match(resolved, /Previous subject: Example Steel/);
});

test("complete approved FAQ replies omit stored questions and multi-answer blocks", () => {
  const source = {
    title: "Who is his best friend?",
    content: "Only he can confirm that. Nice detective work 🙂",
  };
  assert.equal(approvedShortReply(source, 110), source.content);
  assert.equal(
    approvedShortReply(
      {
        title: "Who is he going to marry?",
        content: "That chapter is unwritten.",
      },
      110,
      "Is he married?",
    ),
    null,
  );
  assert.equal(
    approvedShortReply(
      { ...source, content: "Question: Is he dating? Sample reply: Ask him." },
      110,
    ),
    null,
  );
  const plan = understandAevaQuery({
    question: "Who is his best friend?",
    mode: "explore",
    intent: "portfolio",
  });
  assert.equal(
    groundedFallbackAnswer({ sources: [source], plan, maxWords: 110 }),
    source.content,
  );
});

test("refresh restores only validated session data and never creates memory page links", () => {
  const saved = restoreChatSession(
    JSON.stringify({
      version: 1,
      mode: "explore",
      messages: [
        {
          role: "assistant",
          text: "A reply",
          citations: [
            { id: "memory:1", title: "A question?", url: "", kind: "memory" },
          ],
        },
      ],
    }),
  );
  assert.equal(saved?.messages[0].citations?.[0].url, "");
  assert.equal(citationHref(""), undefined);
  assert.equal(citationHref("javascript:alert(1)"), undefined);
  assert.equal(citationHref("/admin"), undefined);
  assert.equal(restoreChatSession("broken"), null);
  assert.equal(restoreChatSession(null), null);
});

test("missing answers link to a relevant page or contact, not arbitrary projects", () => {
  assert.equal(missingAnswer("His work experience").actions[0].href, "/resume");
  assert.equal(missingAnswer("Is he married?").actions[0].href, "/contact");
  assert.equal(missingAnswer("Explain quantum gravity").actions.length, 0);
});

test("earlier notes are bounded visitor claims and provider output cannot dump FAQ headings", () => {
  const history: AevaConversationTurn[] = Array.from(
    { length: 80 },
    (_, index) => ({
      role: "user",
      text: `Visitor topic ${index} ${"detail ".repeat(150)}`,
    }),
  );
  const summary = earlierConversationSummary(history);
  assert.ok(summary.length <= 4_000);
  assert.match(summary, /Earlier visitor message:/);
  assert.equal(earlierConversationSummary([]), "");
  const sources = [
    { title: "Who is his best friend?" },
    { title: "About the owner" },
  ];
  assert.equal(
    isSourceFragmentDump("• Who is his best friend?: Only he knows.", sources),
    true,
  );
  assert.equal(
    isSourceFragmentDump("About the owner: I am building a platform.", sources),
    true,
  );
  assert.equal(
    isSourceFragmentDump(
      "Only he can confirm that. Nice detective work 🙂",
      sources,
    ),
    false,
  );
});
