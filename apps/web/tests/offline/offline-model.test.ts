import assert from "node:assert/strict";
import test from "node:test";
import {
  isOfflineRecord,
  mergeOfflineRecords,
  type OfflineRecord,
} from "../../src/features/offline/model";

const base: OfflineRecord = {
  id: "note-1",
  kind: "note",
  title: "Local",
  body: "one",
  revision: 1,
  updatedAt: "2026-09-19T10:00:00.000Z",
};

test("newer offline revisions replace older local records", () => {
  const newer = {
    ...base,
    body: "two",
    revision: 2,
    updatedAt: "2026-09-19T11:00:00.000Z",
  };
  assert.deepEqual(mergeOfflineRecords([base], [newer]), [newer]);
});

test("equal-revision differences are preserved as conflict copies", () => {
  const conflict = { ...base, body: "different" };
  const merged = mergeOfflineRecords([base], [conflict]);
  assert.equal(merged.length, 2);
  assert.ok(merged.some((record) => record.title.includes("import conflict")));
});

test("same-timestamp conflicts never overwrite one another and repeated imports are idempotent", () => {
  const first = { ...base, body: "first conflict" };
  const second = { ...base, body: "second conflict" };
  const merged = mergeOfflineRecords([base], [first, second]);
  assert.equal(merged.length, 3);
  assert.equal(new Set(merged.map((record) => record.id)).size, 3);
  assert.deepEqual(mergeOfflineRecords(merged, [first, second]), merged);
});

test("offline imports reject malformed URLs, revisions, dates and oversized fields", () => {
  assert.equal(isOfflineRecord(base), true);
  for (const patch of [
    { revision: Infinity },
    { revision: -1 },
    { revision: 1.1 },
    { updatedAt: "invalid" },
    { url: {} },
    { body: "x".repeat(10001) },
  ]) {
    assert.equal(isOfflineRecord({ ...base, ...patch }), false);
  }
});
