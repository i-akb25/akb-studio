import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { safeAevaAnswer } from "../../src/features/aeva/security/output-guard";

const source = (file: string) =>
  readFile(path.resolve(import.meta.dirname, "../../src", file), "utf8");

test("real-world credential shapes are not emitted as assistant answers", () => {
  for (const value of [
    `AIza${"a".repeat(35)}`,
    `sk-proj-${"a".repeat(30)}`,
    "APPS_SCRIPT_SIGNING_SECRET: hidden",
    "CLOUDINARY_API_SECRET=hidden",
  ])
    assert.equal(safeAevaAnswer(value, 100), null);
  assert.equal(
    safeAevaAnswer("CodeVet uses TypeScript and GitHub APIs.", 100),
    "CodeVet uses TypeScript and GitHub APIs.",
  );
});

test("provider credentials stay out of URLs and thoughts stay out of replies", async () => {
  for (const file of [
    "features/aeva/server/provider.ts",
    "features/aeva/private/provider.ts",
  ]) {
    const provider = await source(file);
    assert.match(provider, /"x-goog-api-key": apiKey/);
    assert.doesNotMatch(provider, /generateContent\?key=/);
    assert.match(provider, /filter\(\(part\) => !part.thought\)/);
    assert.match(provider, /maxOutputTokens: 2_048/);
    assert.match(provider, /providerThinkingConfig\(model\)/);
    assert.match(provider, /store: false/);
  }
});

test("shared exchanges are atomic, ended conversations cannot be appended and ending is rate limited", async () => {
  const persistence = await source("features/aeva/server/persistence.ts");
  assert.match(persistence, /prisma\.\$transaction/);
  assert.match(persistence, /endedAt: null/);
  assert.match(persistence, /tx\.aevaMessage\.createMany/);
  const end = await source("app/api/aeva/end/route.ts");
  assert.match(end, /await acceptAevaEndRequest\(request\)/);
});

test("admin roles reject inherited property names and multipart uploads use a streaming limit", async () => {
  assert.match(
    await source("features/admin/server/admin-auth.ts"),
    /Object\.hasOwn\(ROLE_PERMISSIONS, value\)/,
  );
  assert.match(
    await source("app/api/admin/media/route.ts"),
    /await readLimitedBody/,
  );
});

test("chat clients bound history and detect incomplete or duplicate streams", async () => {
  const route = await source("app/api/aeva/route.ts");
  assert.match(
    route,
    /history\.slice\(-aevaServerConfig\.maxConversationTurns\)/,
  );
  assert.match(route, /\.max\(12\)/);
  const chat = await source("features/aeva/components/aeva-experience.tsx");
  assert.match(chat, /boundedConversationHistory\(messages\)/);
  assert.match(chat, /if \(receivedAnswer\) continue/);
  assert.match(
    chat,
    /if \(!receivedAnswer\) throw new Error\("incomplete_stream"\)/,
  );
  assert.match(chat, /requestRef\.current\?\.abort/);
  assert.match(
    await source("features/aeva/components/conversation-feedback.tsx"),
    /boundedConversationHistory\(transcript\)/,
  );
});

test("offline import errors are not overwritten with a false success message", async () => {
  const offline = await source(
    "features/offline/components/offline-workspace.tsx",
  );
  assert.match(
    offline,
    /if \(persist\(mergeOfflineRecords\(records, incoming\)\)\)/,
  );
  assert.match(offline, /value.records.every\(isOfflineRecord\)/);
});
