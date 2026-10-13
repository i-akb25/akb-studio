import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { publishGitHubFiles } from "../../src/features/admin/server/github-atomic-publish";

const head = "a".repeat(40);
const base = "b".repeat(40);
const tree = "c".repeat(40);
const commit = "d".repeat(40);
const manifest = JSON.stringify({
  journal: [{ id: "existing" }],
  knowledge: [],
});

async function scenario(
  options: {
    readStatus?: number;
    malformed?: boolean;
    conflict?: boolean;
  } = {},
) {
  const calls: Array<{
    url: string;
    method: string;
    body: Record<string, unknown> | undefined;
  }> = [];
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body =
        typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
      calls.push({ url, method, body });
      assert.equal(init?.cache, "no-store");
      assert.ok(init?.signal);
      if (url.includes("/git/ref/heads/"))
        return Response.json({ object: { sha: head } });
      if (url.endsWith(`/git/commits/${head}`))
        return Response.json({ tree: { sha: base } });
      if (url.includes("/contents/"))
        return options.readStatus
          ? Response.json({}, { status: options.readStatus })
          : Response.json({
              type: "file",
              encoding: "base64",
              content: Buffer.from(
                options.malformed ? "broken" : manifest,
              ).toString("base64"),
            });
      if (url.endsWith("/git/trees"))
        return Response.json({ sha: tree }, { status: 201 });
      if (url.endsWith("/git/commits"))
        return Response.json({ sha: commit }, { status: 201 });
      if (url.includes("/git/refs/heads/"))
        return Response.json({}, { status: options.conflict ? 422 : 200 });
      throw new Error("Unexpected API request");
    },
  );
  const publish = () =>
    publishGitHubFiles({
      repositoryUrl: "https://api.github.com/repos/owner/content",
      ref: "main",
      headers: { "Content-Type": "application/json" },
      manifestPath: "content/content-manifest.json",
      message: "Publish reviewed content",
      buildFiles(raw) {
        const current =
          raw === null ? { journal: [], knowledge: [] } : JSON.parse(raw);
        current.journal.push({ id: "new" });
        return [
          { path: "content/journal/new.md", content: "New article" },
          {
            path: "content/content-manifest.json",
            content: JSON.stringify(current),
          },
        ];
      },
    });
  return { calls, publish, restore: () => fetchMock.mock.restore() };
}

test("editorial document and fresh manifest move together in one non-forced commit", async () => {
  const run = await scenario();
  try {
    await run.publish();
    assert.equal(run.calls.length, 6);
    assert.ok(run.calls[2]?.url.endsWith(`?ref=${head}`));
    const change = run.calls[3]?.body;
    assert.equal(change?.base_tree, base);
    const files = change?.tree as Array<{ path: string; content: string }>;
    assert.equal(files.length, 2);
    assert.deepEqual(JSON.parse(files[1]?.content ?? "").journal, [
      { id: "existing" },
      { id: "new" },
    ]);
    assert.deepEqual(run.calls[4]?.body?.parents, [head]);
    assert.deepEqual(run.calls[5]?.body, { sha: commit, force: false });
  } finally {
    run.restore();
  }
});

test("failed or malformed manifest reads never trigger repository writes", async () => {
  for (const options of [
    { readStatus: 403 },
    { readStatus: 500 },
    { malformed: true },
  ]) {
    const run = await scenario(options);
    try {
      await assert.rejects(run.publish());
      assert.ok(run.calls.every((call) => call.method === "GET"));
    } finally {
      run.restore();
    }
  }
});

test("concurrent branch updates fail without forcing or retrying a stale manifest", async () => {
  const run = await scenario({ conflict: true });
  try {
    await assert.rejects(run.publish(), /Publication conflict/);
    assert.equal(run.calls.filter((call) => call.method === "PATCH").length, 1);
    assert.equal(run.calls.at(-1)?.body?.force, false);
  } finally {
    run.restore();
  }
});
