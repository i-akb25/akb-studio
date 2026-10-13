import assert from "node:assert/strict";
import test from "node:test";
import { checkManifestVersion } from "../../src/features/pravaah/manifest-version";
import { EMPTY_FEATURE_MANIFEST } from "../../src/features/pravaah/model";

test("Pravaah rejects stale snapshots rather than overwriting a concurrent change", () => {
  const initial = structuredClone(EMPTY_FEATURE_MANIFEST);
  const concurrent = { ...initial, ignoredExternalIds: ["new-discovery"] };
  assert.deepEqual(checkManifestVersion(initial, initial), initial);
  assert.throws(
    () => checkManifestVersion(concurrent, initial),
    /Pravaah registry changed/,
  );
  assert.deepEqual(concurrent.ignoredExternalIds, ["new-discovery"]);
  assert.equal(checkManifestVersion(null, initial), undefined);
  assert.throws(
    () => checkManifestVersion({ items: "broken" }, initial),
    /registry is invalid/,
  );
});
