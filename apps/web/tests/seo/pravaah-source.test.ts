import assert from "node:assert/strict";
import test from "node:test";

import { featureItemSchema } from "../../src/features/pravaah/model";

const baseItem = {
  id: "signal-123",
  source: "linkedin" as const,
  type: "post" as const,
  title: "Engineering field note",
  excerpt: "A public engineering note with enough context for the archive.",
  canonicalUrl:
    "https://www.linkedin.com/posts/example?utm_source=test#fragment",
  publishedAt: "2026-09-17T09:00:00.000Z",
  syncedAt: "2026-09-17T10:00:00.000Z",
  author: "Anurag Kumar Bharti",
  relationship: "by-akb" as const,
  tags: ["engineering"],
  pinned: false,
  priority: 0,
  status: "published" as const,
};

test("preserves the source canonical while removing tracking and fragments", () => {
  const parsed = featureItemSchema.parse(baseItem);
  assert.equal(parsed.canonicalUrl, "https://www.linkedin.com/posts/example");
});

test("rejects a source label that does not match its canonical host", () => {
  const parsed = featureItemSchema.safeParse({
    ...baseItem,
    canonicalUrl: "https://x.com/i_official_akb/status/1",
  });
  assert.equal(parsed.success, false);
});

test("rejects private AKB Studio routes as public context", () => {
  const parsed = featureItemSchema.safeParse({
    ...baseItem,
    source: "manual",
    canonicalUrl: undefined,
    internalPath: "/admin/pravaah",
  });
  assert.equal(parsed.success, false);
});
