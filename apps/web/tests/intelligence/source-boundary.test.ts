import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const webRoot = path.resolve(import.meta.dirname, "../..");

test("the graph project adapter preserves explicit Aeva approval", async () => {
  const source = await readFile(
    path.join(
      webRoot,
      "src/features/intelligence/server/portfolio-knowledge-graph.ts",
    ),
    "utf8",
  );

  assert.match(source, /aevaApproved:\s*true/);
  assert.match(source, /publishedProjects/);
  assert.doesNotMatch(source, /getProjectRegistry/);
});

test("current activity requires a published, unexpired owner status", async () => {
  const source = await readFile(
    path.join(webRoot, "src/features/aeva/server/current-status.ts"),
    "utf8",
  );

  assert.match(source, /state:\s*"PUBLISHED"/);
  assert.match(source, /validUntil:\s*\{\s*gt:\s*now\s*\}/);
  assert.doesNotMatch(source, /calendar|location/i);
});
