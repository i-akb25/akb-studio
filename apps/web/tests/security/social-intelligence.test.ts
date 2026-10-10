import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { featureItemSchema } from "../../src/features/pravaah/model";

async function source(relativePath: string) {
  return readFile(path.resolve(import.meta.dirname, relativePath), "utf8");
}

test("social verification is owner-only, same-origin and rate limited", async () => {
  const route = await source(
    "../../src/app/api/admin/social-intelligence/route.ts",
  );
  assert.match(route, /canAdmin\("users:manage"\)/);
  assert.match(route, /assertSameOrigin/);
  assert.match(route, /scope: "admin-social-verification"/);
  assert.match(route, /readJsonBody\(request, 2_048\)/);
  assert.match(route, /"Cache-Control": "no-store"/);
});

test("permission manifest reports configuration without returning secrets", async () => {
  const manifest = await source(
    "../../src/features/social-intelligence/server/manifest.ts",
  );
  assert.match(manifest, /configured: configured\(environment, name\)/);
  assert.doesNotMatch(manifest, /value:\s*environment\[name\]/);
  assert.match(manifest, /automaticIngestion: false/);
  assert.match(manifest, /automaticPublishing: false/);
  assert.match(manifest, /feedsAeva: false/);
  assert.match(manifest, /No scraping/);
});

test("GitHub verifier is read-only and uses official bounded endpoints", async () => {
  const verifier = await source(
    "../../src/features/social-intelligence/server/github-verifier.ts",
  );
  assert.match(verifier, /https:\/\/api\.github\.com/);
  assert.match(verifier, /AbortSignal\.timeout\(TIMEOUT_MS\)/);
  assert.match(verifier, /cache: "no-store"/);
  assert.doesNotMatch(verifier, /method:\s*"(?:POST|PUT|PATCH|DELETE)"/);
  assert.doesNotMatch(verifier, /linkedin\.com|instagram\.com|x\.com/);
});

test("provider failures stay visible instead of becoming empty discovery", async () => {
  const [adapter, publisher, consoleSource] = await Promise.all([
    source("../../src/features/pravaah/server/github-adapter.ts"),
    source("../../src/features/pravaah/server/feature-publisher.ts"),
    source("../../src/features/admin/components/pravaah-console.tsx"),
  ]);
  assert.match(adapter, /status: "degraded"/);
  assert.match(adapter, /recordOperationalHealth/);
  assert.match(publisher, /key: "social_github_mirror"/);
  assert.match(consoleSource, /Provider status:/);
});

test("Instagram entries require their own canonical HTTPS host", () => {
  const base = {
    id: "instagram-post-1",
    source: "instagram" as const,
    type: "post" as const,
    title: "A reviewed Instagram post",
    excerpt: "A manually reviewed public post from the owner profile.",
    syncedAt: "2026-10-10T00:00:00.000Z",
    author: "Anurag Kumar Bharti",
    relationship: "by-akb" as const,
    tags: [],
    pinned: false,
    priority: 0,
    status: "published" as const,
  };
  assert.equal(
    featureItemSchema.safeParse({
      ...base,
      canonicalUrl: "https://www.instagram.com/p/example/",
    }).success,
    true,
  );
  assert.equal(
    featureItemSchema.safeParse({
      ...base,
      canonicalUrl: "https://example.com/copied-post",
    }).success,
    false,
  );
});

test("2.3 adds no destructive schema or automatic social mutation", async () => {
  const [route, verifier, manifest] = await Promise.all([
    source("../../src/app/api/admin/social-intelligence/route.ts"),
    source("../../src/features/social-intelligence/server/github-verifier.ts"),
    source("../../src/features/social-intelligence/server/manifest.ts"),
  ]);
  const combined = `${route}\n${verifier}\n${manifest}`;
  assert.doesNotMatch(combined, /deleteMany|updateMany|createMany/);
  assert.doesNotMatch(combined, /prisma\.(?:contact|user|session|aeva)/i);
});

test("owner diagnostics expose provider state but never the Gemini key", async () => {
  const page = await source("../../src/app/admin/(protected)/aeva/page.tsx");
  assert.match(page, /providerConfigured/);
  assert.match(page, /AEVA_WEB_SEARCH_ENABLED/);
  assert.match(page, /gemini-3\.8-flash/);
  assert.doesNotMatch(page, /\{process\.env\.GEMINI_API_KEY\}/);
});
