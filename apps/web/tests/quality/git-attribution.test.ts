import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("attribution guard rejects AI identities and trailers without rewriting authors", async () => {
  const { attributionFindings } = await import(
    pathToFileURL(
      path.resolve(
        import.meta.dirname,
        "../../../../scripts/quality/check-git-attribution.mjs",
      ),
    ).href
  );
  assert.deepEqual(
    attributionFindings({
      author: "Anurag <owner@example.com>",
      committer: "GitHub <noreply@github.com>",
      message: "fix: provider fallback",
    }),
    [],
  );
  assert.equal(
    attributionFindings({ author: "Codex <codex@openai.com>" }).length,
    1,
  );
  assert.equal(
    attributionFindings({ committer: "Claude <bot@anthropic.com>" }).length,
    1,
  );
  assert.equal(
    attributionFindings({
      message: "fix: reliability\n\nCo-authored-by: Codex <codex@openai.com>",
    }).length,
    1,
  );
  assert.deepEqual(
    attributionFindings({ message: "fix: Codex attribution guard" }),
    [],
  );
  assert.deepEqual(
    attributionFindings({
      message: "Co-authored-by: Human Reviewer <reviewer@example.com>",
    }),
    [],
  );
});
