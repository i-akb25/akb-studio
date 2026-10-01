import assert from "node:assert/strict";
import test from "node:test";

import type { JournalSummary } from "../../src/features/content/model";
import { createRssFeed } from "../../src/features/seo/feed";

const record: JournalSummary = {
  id: "journal-1",
  kind: "journal",
  slug: "signals-and-systems",
  canonicalPath: "/journal/signals-and-systems",
  title: "Signals & Systems <Field Note>",
  description: "A tested & documented engineering note.",
  status: "published",
  publishedAt: "2026-09-17T09:00:00.000Z",
  disciplines: ["electrical"],
  topics: ["signals"],
  tags: ["DSP"],
  source: { type: "original", label: "AKB Studio" },
  attachments: [],
  relations: [],
  readingMinutes: 4,
};

test("RSS uses published canonical URLs and escapes XML", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://portfolio.example.com";

  try {
    const feed = createRssFeed({
      title: "Journal",
      description: "Field notes",
      path: "/journal/feed.xml",
      records: [record],
    });

    assert.ok(feed);
    assert.match(feed, /Signals &amp; Systems &lt;Field Note&gt;/);
    assert.match(
      feed,
      /https:\/\/portfolio\.example\.com\/journal\/signals-and-systems/,
    );
    assert.match(feed, /xmlns:dc="http:\/\/purl\.org\/dc\/elements\/1\.1\/"/);
    assert.match(feed, /<dc:creator>Anurag Kumar Bharti<\/dc:creator>/);
    assert.doesNotMatch(feed, /<Field Note>/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("RSS fails closed without a canonical origin", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  const previousVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

  try {
    assert.equal(
      createRssFeed({
        title: "Journal",
        description: "Field notes",
        path: "/journal/feed.xml",
        records: [record],
      }),
      null,
    );
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previous;
    if (previousVercel !== undefined)
      process.env.VERCEL_PROJECT_PRODUCTION_URL = previousVercel;
  }
});
