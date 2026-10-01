import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publishing integrations use approved GitHub APIs without social scraping", async () => {
  const sources = await Promise.all([
    readFile(
      new URL(
        "../../src/features/pravaah/server/github-adapter.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../../src/features/pravaah/server/feature-publisher.ts",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  const combined = sources.join("\n");
  assert.match(combined, /api\.github\.com/);
  assert.doesNotMatch(combined, /linkedin\.com\/(?:feed|in)\//i);
  assert.doesNotMatch(combined, /x\.com\/[^"'`\s]+/i);
});

test("offline service worker excludes private and API routes", async () => {
  const worker = await readFile(
    new URL("../../public/sw.js", import.meta.url),
    "utf8",
  );
  for (const route of ["/api/", "/admin", "/contact", "/resume"])
    assert.match(worker, new RegExp(route.replace("/", "\\/")));
});
