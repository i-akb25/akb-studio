import assert from "node:assert/strict";
import test from "node:test";
import {
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
