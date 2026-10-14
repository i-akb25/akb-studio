import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const testRequire = createRequire(import.meta.url);
const { transformSync } = createRequire(
  testRequire.resolve("tsx/package.json"),
)("esbuild");

import { z } from "zod";
import { safeHealthSummary } from "../../src/features/admin/core/service-health-summary";
import * as contract from "../../src/features/admin/core/submissions-contract";

async function routeHarness(
  session: unknown,
  originValid = true,
  health = false,
) {
  const calls: string[] = [];
  const filename = health ? "service-health" : "submissions";
  const source = await readFile(
    path.resolve(
      import.meta.dirname,
      `../../src/app/api/admin/${filename}/route.ts`,
    ),
    "utf8",
  );
  class SubmissionError extends Error {
    status = 409;
  }
  const exports: Record<string, (request: Request) => Promise<Response>> = {};
  const modules: Record<string, unknown> = {
    "@/features/admin/core/service-health-summary": { safeHealthSummary },
    zod: { z },
    "@/features/admin/core/submissions-contract": contract,
    "@/features/admin/server/admin-auth": {
      getAdminSession: async () => session,
      assertSameOrigin: () => {
        calls.push("origin");
        if (!originValid) throw new Error("invalid origin");
      },
    },
    "@/features/admin/server/admin-api-response": {
      adminErrorResponse: () =>
        Response.json({ error: "invalid input" }, { status: 400 }),
    },
    "@/server/security/request": {
      readJsonBody: async (request: Request) => {
        calls.push("body");
        return request.json();
      },
    },
    "@/server/db/prisma": {
      prisma: {
        operationalHealth: {
          findMany: async () => {
            calls.push("health");
            return [];
          },
        },
      },
    },
    "@/features/admin/server/submissions": {
      SubmissionError,
      listSubmissions: async () => {
        calls.push("list");
        return { items: [] };
      },
      getSubmission: async () => {
        calls.push("detail");
        return {};
      },
      mutateSubmission: async () => {
        calls.push("write");
      },
    },
  };
  const module = { exports };
  vm.runInNewContext(
    transformSync(source, { loader: "ts", format: "cjs", target: "es2022" })
      .code,
    {
      exports,
      module,
      require: (name: string) => {
        assert.ok(name in modules, name);
        return modules[name];
      },
      Response,
      URL,
      Object,
    },
  );
  return { routes: module.exports, calls };
}
const owner = {
  role: "owner",
  user: { id: "owner-test", twoFactorEnabled: true },
};
const update = {
  action: "contact-update",
  id: "record",
  revision: "2026-10-14T00:00:00.000Z",
  state: "CLOSED",
  note: "Owner note",
};
const request = (body = update) =>
  new Request("https://example.test/api/admin/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://example.test",
    },
    body: JSON.stringify(body),
  });

test("submissions and health deny every non-owner before storage or body access", async () => {
  for (const session of [
    null,
    { role: "owner", user: { twoFactorEnabled: false } },
    ...["viewer", "moderator", "editor", "toString"].map((role) => ({
      role,
      user: { twoFactorEnabled: true },
    })),
  ]) {
    const h = await routeHarness(session);
    assert.equal(
      (
        await h.routes.GET(
          new Request(
            "https://example.test/api/admin/submissions?resource=feedback&id=secret",
          ),
        )
      ).status,
      403,
    );
    assert.equal((await h.routes.POST(request())).status, 403);
    assert.deepEqual(h.calls, []);
    const health = await routeHarness(session, true, true);
    assert.equal(
      (
        await health.routes.GET(
          new Request("https://example.test/api/admin/service-health"),
        )
      ).status,
      403,
    );
    assert.deepEqual(health.calls, []);
  }
});
test("authenticated foreign-origin mutations stop before parsing or writing", async () => {
  const h = await routeHarness(owner, false);
  assert.equal((await h.routes.POST(request())).status, 403);
  assert.deepEqual(h.calls, ["origin"]);
});
test("owner requests are no-store and cannot smuggle arbitrary fields/actions", async () => {
  const h = await routeHarness(owner);
  const read = await h.routes.GET(
    new Request("https://example.test/api/admin/submissions?resource=contacts"),
  );
  assert.equal(read.status, 200);
  assert.match(read.headers.get("Cache-Control") || "", /private, no-store/);
  assert.equal((await h.routes.POST(request())).status, 200);
  assert.deepEqual(h.calls, ["list", "origin", "body", "write"]);
  const bad = await routeHarness(owner);
  assert.equal(
    (
      await bad.routes.POST(
        request({
          ...update,
          message: "replace visitor text",
        } as typeof update),
      )
    ).status,
    400,
  );
  assert.ok(!bad.calls.includes("write"));
  for (const extra of [
    { sql: "SELECT *" },
    { actorId: "other" },
    { action: "admin_send_notifications" },
    { originalMessage: "override" },
  ])
    assert.equal(
      contract.submissionMutation.safeParse({ ...update, ...extra }).success,
      false,
    );
});
test("confirmation and stale record checks run before deleting source records", async () => {
  const file = await readFile(
    path.resolve(
      import.meta.dirname,
      "../../src/features/admin/server/submissions.ts",
    ),
    "utf8",
  );
  const calls: string[] = [];
  const exports: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  const modules: Record<string, unknown> = {
    "server-only": {},
    "node:crypto": await import("node:crypto"),
    zod: { z },
    "../core/submissions-contract": contract,
    "@/features/aeva/server/encryption": { decryptAevaText: () => null },
    "@/features/publishing/server/publishing-service": {
      callPublishingService: async () => {
        calls.push("external");
        return { ok: true };
      },
    },
    "@/server/db/prisma": { prisma: {} },
    "./audit": {
      recordAudit: async () => {
        calls.push("audit");
      },
      runAuditedMutation: async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          contactSubmission: {
            findUnique: async () => ({
              id: "record",
              state: "NEW",
              updatedAt: new Date("2026-10-14T00:00:00Z"),
            }),
            deleteMany: async () => {
              calls.push("delete");
              return { count: 1 };
            },
          },
        }),
    },
  };
  const module = { exports };
  vm.runInNewContext(
    transformSync(file, { loader: "ts", format: "cjs", target: "es2022" }).code,
    { exports, module, require: (n: string) => modules[n], Date },
  );
  await assert.rejects(
    () =>
      module.exports.mutateSubmission(
        {
          action: "contact-delete",
          id: "record",
          confirmation: "wrong",
          revision: update.revision,
        },
        "owner",
      ),
    /confirm deletion/,
  );
  await assert.rejects(
    () =>
      module.exports.mutateSubmission(
        {
          action: "contact-delete",
          id: "record",
          confirmation: "record",
          revision: "2026-01-01T00:00:00.000Z",
        },
        "owner",
      ),
    /changed/,
  );
  assert.deepEqual(calls, []);
});

test("health never returns arbitrary provider error text or credentials", () => {
  assert.equal(
    safeHealthSummary("Publishing service rejected request: unauthorized"),
    "Publishing service rejected request: unauthorized",
  );
  for (const raw of [
    "Bearer private-secret",
    "Publishing service rejected request: hidden-secret",
    "User email private@example.test",
    "sk-private-key",
  ])
    assert.ok(!safeHealthSummary(raw).includes(raw));
});
