import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  type AuditIntegrityEntry,
  hashAuditEntry,
  verifyAuditEntries,
} from "../../src/features/admin/server/audit-integrity";
import {
  boundedRetentionDays,
  retentionCutoff,
  retentionDeadline,
} from "../../src/features/operations/retention-policy";

async function source(relativePath: string) {
  return readFile(path.resolve(import.meta.dirname, relativePath), "utf8");
}

function auditEntry(
  id: string,
  createdAt: Date,
  previousHash: string | null,
): AuditIntegrityEntry {
  const entry = {
    id,
    actorId: "owner",
    action: "UPDATE",
    entityType: "Project",
    entityId: id,
    before: null,
    after: { state: "PUBLISHED" },
    previousHash,
    entryHash: null,
    createdAt,
  };
  return { ...entry, entryHash: hashAuditEntry(entry) };
}

test("retention settings reject invalid values and stay inside policy bounds", () => {
  assert.equal(boundedRetentionDays(undefined, 180, 1, 365), 180);
  assert.equal(boundedRetentionDays("not-a-number", 180, 1, 365), 180);
  assert.equal(boundedRetentionDays("0", 180, 1, 365), 1);
  assert.equal(boundedRetentionDays("999", 180, 1, 365), 365);
  assert.equal(boundedRetentionDays("12.9", 180, 1, 365), 12);

  const now = new Date("2026-10-10T00:00:00.000Z");
  assert.equal(
    retentionDeadline(now, 2).toISOString(),
    "2026-10-12T00:00:00.000Z",
  );
  assert.equal(
    retentionCutoff(now, 2).toISOString(),
    "2026-10-08T00:00:00.000Z",
  );
});

test("audit verification detects tampering and accepts a retained checkpoint", () => {
  const first = auditEntry(
    "first",
    new Date("2026-10-09T00:00:00.000Z"),
    "rotated-history-hash",
  );
  const second = auditEntry(
    "second",
    new Date("2026-10-10T00:00:00.000Z"),
    first.entryHash,
  );
  const valid = verifyAuditEntries([second, first]);
  assert.equal(valid.valid, true);
  assert.equal(valid.checkpointed, true);
  assert.equal(valid.headHash, second.entryHash);

  const broken = verifyAuditEntries([
    first,
    { ...second, after: { state: "DRAFT" } },
  ]);
  assert.equal(broken.valid, false);
  assert.equal(broken.errorId, "second");
});

test("audited writes serialize the hash chain before mutating data", async () => {
  const audit = await source("../../src/features/admin/server/audit.ts");
  assert.match(audit, /pg_advisory_xact_lock/);
  assert.ok(
    audit.indexOf("await lockAuditChain(tx)") <
      audit.indexOf("const result = await mutation(tx)"),
  );
  assert.match(audit, /appendAudit\(tx, audit\(result\), true\)/);
});

test("retention cleanup reports every category and preserves a chain anchor", async () => {
  const cleanup = await source("../../scripts/retention-cleanup.ts");
  assert.match(cleanup, /Dry run only/);
  assert.match(cleanup, /auditAnchor/);
  assert.match(cleanup, /id: \{ not: auditAnchor\.id \}/);
  assert.match(cleanup, /anonymousJourney\.deleteMany/);
  assert.match(cleanup, /retentionUntil: \{ lte: now \}/);
  assert.match(cleanup, /trashContactEmail/);
});

test("private operational data has explicit role boundaries", async () => {
  const [requests, operations, studioPage, studioWorkspace] = await Promise.all(
    [
      source("../../src/app/admin/(protected)/requests/page.tsx"),
      source("../../src/app/admin/(protected)/personal-operations/page.tsx"),
      source("../../src/app/admin/(protected)/studio/page.tsx"),
      source("../../src/features/admin/components/studio-workspace.tsx"),
    ],
  );
  assert.match(requests, /requireAdmin\("contact:moderate"\)/);
  assert.match(operations, /requireAdmin\("audit:read"\)/);
  assert.match(studioPage, /const isOwner = session\.role === "owner"/);
  assert.match(studioPage, /canManageGovernance=\{isOwner\}/);
  assert.match(studioWorkspace, /canManageGovernance \? \(/);
});

test("approval and reminder state changes are single-use transitions", async () => {
  const route = await source("../../src/app/api/admin/studio/route.ts");
  assert.match(route, /studioSuggestion\.updateMany/);
  assert.match(route, /where: \{ id: input\.id, state: "PENDING" \}/);
  assert.match(route, /followUpReminder\.updateMany/);
  assert.match(route, /tx\.studioSuggestion\.findFirst/);
  assert.match(route, /error instanceof OperationConflict/);
});
