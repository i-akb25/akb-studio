import assert from "node:assert/strict";
import test from "node:test";

import {
  absoluteSiteUrl,
  createPageMetadata,
  getSiteOrigin,
} from "../../src/features/seo/site-config";

test("resolves one HTTPS canonical origin", () => {
  const environment = {
    NEXT_PUBLIC_SITE_URL: "https://portfolio.example.com",
  };

  assert.equal(
    getSiteOrigin(environment)?.href,
    "https://portfolio.example.com/",
  );
  assert.equal(
    absoluteSiteUrl("/journal/field-note", environment),
    "https://portfolio.example.com/journal/field-note",
  );
});

test("does not invent a canonical origin when production is not configured", () => {
  assert.equal(getSiteOrigin({}), undefined);
  assert.equal(absoluteSiteUrl("/journal", {}), undefined);
});

test("allows a local production build without inventing a canonical origin", () => {
  assert.equal(getSiteOrigin({ NODE_ENV: "production" }), undefined);
});

test("requires a canonical origin for a production deployment", () => {
  assert.throws(
    () => getSiteOrigin({ NODE_ENV: "production", VERCEL_ENV: "production" }),
    /canonical|NEXT_PUBLIC_SITE_URL|VERCEL_PROJECT_PRODUCTION_URL/i,
  );
});

test("rejects unsafe or placeholder canonical origins", () => {
  assert.throws(() =>
    getSiteOrigin({ NEXT_PUBLIC_SITE_URL: "http://portfolio.example.com" }),
  );
  assert.throws(() =>
    getSiteOrigin({ NEXT_PUBLIC_SITE_URL: "https://your-project.vercel.app" }),
  );
  assert.throws(() =>
    getSiteOrigin({ NEXT_PUBLIC_SITE_URL: "https://user:pass@example.com" }),
  );
});

test("builds canonical and social metadata from the same origin", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://portfolio.example.com";

  try {
    const metadata = createPageMetadata({
      title: "Journal",
      description: "Engineering field notes.",
      path: "/journal",
    });

    assert.equal(
      metadata.alternates?.canonical,
      "https://portfolio.example.com/journal",
    );
    assert.equal(
      metadata.openGraph?.url,
      "https://portfolio.example.com/journal",
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
