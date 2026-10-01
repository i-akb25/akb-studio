import assert from "node:assert/strict";
import test from "node:test";
import { publicJourneyTarget } from "../../src/features/analytics/model";

test("normalizes public journeys without accepting arbitrary paths", () => {
  assert.deepEqual(publicJourneyTarget("/projects/automated-drone-delivery"), {
    category: "projects",
    projectSlug: "automated-drone-delivery",
  });
  assert.deepEqual(publicJourneyTarget("/lab"), { category: "lab" });
  assert.equal(publicJourneyTarget("/contact"), null);
  assert.equal(publicJourneyTarget("/admin"), null);
  assert.equal(publicJourneyTarget("/projects/../../private"), null);
});
