import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  hashAuditEntry,
  nextAuditTimestamp,
  verifyAuditEntries,
} from "../../src/features/admin/server/audit-integrity";
import { databaseFailure } from "../../src/features/admin/server/database-errors";
import { nullableOptionalText } from "../../src/features/admin/server/optional-fields";
import { safeErrorFields } from "../../src/server/logging/error-fields";

test("clearing an optional field stores null while omitted fields remain unchanged", () => {
  assert.equal(nullableOptionalText(""), null);
  assert.equal(nullableOptionalText("  "), null);
  assert.equal(nullableOptionalText(undefined), undefined);
  assert.equal(nullableOptionalText("  useful note  "), "useful note");
});

test("rapid audit writes and clock rollback preserve hash-chain ordering", () => {
  const now = new Date("2026-10-13T15:00:00.000Z");
  const first = {
    id: "z",
    actorId: null,
    action: "CREATE",
    entityType: "AevaMemory",
    entityId: "one",
    before: null,
    after: null,
    previousHash: null,
    createdAt: nextAuditTimestamp(now),
  };
  const firstHash = hashAuditEntry(first);
  const second = {
    ...first,
    id: "a",
    entityId: "two",
    previousHash: firstHash,
    createdAt: nextAuditTimestamp(now, first.createdAt),
  };
  assert.ok(second.createdAt > first.createdAt);
  assert.equal(
    nextAuditTimestamp(
      new Date(now.getTime() - 1000),
      second.createdAt,
    ).getTime(),
    second.createdAt.getTime() + 1,
  );
  assert.equal(
    verifyAuditEntries([
      { ...second, entryHash: hashAuditEntry(second) },
      { ...first, entryHash: firstHash },
    ]).valid,
    true,
  );
});

test("database failures distinguish schema, conflict and query errors without exposing SQL", () => {
  assert.equal(databaseFailure("P2010")?.status, 500);
  assert.equal(databaseFailure("P2022")?.status, 503);
  assert.equal(databaseFailure("P2034")?.status, 409);
  assert.equal(databaseFailure("P2025")?.status, 404);
  assert.equal(databaseFailure("toString"), undefined);
});

test("database diagnostics record safe codes and void cause without query or personal content", () => {
  const error = Object.assign(new Error("secret query and visitor message"), {
    code: "P2010",
    meta: {
      query: "SELECT sensitive",
      driverAdapterError: {
        cause: {
          kind: "UnsupportedNativeDataType",
          type: "void",
          originalMessage: "private SQL",
        },
      },
    },
  });
  const fields = safeErrorFields(error);
  assert.equal(fields.errorCode, "P2010");
  assert.equal(fields.unsupportedDatabaseType, "void");
  assert.doesNotMatch(
    JSON.stringify(fields),
    /sensitive|secret|visitor|private/,
  );
  const postgres = Object.assign(new Error("private"), {
    meta: {
      driverAdapterError: {
        cause: { kind: "postgres", originalCode: "42501" },
      },
    },
  });
  assert.equal(safeErrorFields(postgres).databaseCode, "42501");
});

test("project saves preserve non-editor project links and optional fields use clear semantics", async () => {
  const root = path.resolve(import.meta.dirname, "../../src");
  const operations = await readFile(
    path.join(root, "app/api/admin/operations/route.ts"),
    "utf8",
  );
  const aeva = await readFile(
    path.join(root, "app/api/admin/aeva/route.ts"),
    "utf8",
  );
  assert.match(operations, /kind: \{ in: \["repository", "demo"\] \}/);
  assert.match(operations, /nullableOptionalText\(input\.email\)/);
  assert.match(aeva, /transform\(nullableOptionalText\)/);
});
