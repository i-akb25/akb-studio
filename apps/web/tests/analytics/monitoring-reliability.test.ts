import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { ANALYTICS_EVENTS } from "../../src/features/analytics/model";
import {
  failureAlert,
  freshnessAlert,
} from "../../src/features/analytics/server/thresholds";

const webRoot = path.resolve(import.meta.dirname, "../..");

test("conversion inventory covers the requested public journeys", () => {
  assert.deepEqual(ANALYTICS_EVENTS, [
    "resume_download",
    "project_open",
    "article_open",
    "aeva_open",
    "aeva_success",
    "aeva_failure",
    "contact_open",
    "contact_submit_success",
    "contact_submit_failure",
  ]);
});

test("alert thresholds distinguish warning and critical states", () => {
  assert.equal(
    failureAlert({
      id: "aeva",
      label: "Aeva",
      count: 5,
      warningAt: 5,
      criticalAt: 20,
    }).level,
    "warning",
  );
  assert.equal(
    freshnessAlert({
      id: "backup",
      label: "Backup",
      observedAt: new Date("2026-09-01T00:00:00Z"),
      warningAfterHours: 168,
      criticalAfterHours: 720,
      now: new Date("2026-10-02T00:00:00Z"),
    }).level,
    "critical",
  );
});

test("aggregate analytics schema excludes identity and prompt content", async () => {
  const schema = await readFile(
    path.join(webRoot, "../../prisma/schema.prisma"),
    "utf8",
  );
  const metric =
    schema.match(/model AnalyticsMetric \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(metric, /capturedOn/);
  assert.match(metric, /count/);
  assert.doesNotMatch(metric, /email|name|ipAddress|userAgent|prompt|message/i);
});

test("portfolio music is user initiated and rolling text respects reduced motion", async () => {
  const [music, homepage] = await Promise.all([
    readFile(
      path.join(webRoot, "src/features/media/components/music-control.tsx"),
      "utf8",
    ),
    readFile(
      path.join(webRoot, "src/features/homepage/homepage-surface.css"),
      "utf8",
    ),
  ]);
  assert.match(music, /preload="none"/);
  assert.doesNotMatch(music, /autoPlay/);
  assert.match(music, /No portfolio music is published/);
  assert.match(music, /disabled=\{!track\}/);
  assert.match(homepage, /prefers-reduced-motion:\s*reduce/);
  assert.match(homepage, /home-collaboration-roll-left/);
  assert.match(homepage, /home-collaboration-roll-right/);
});

test("Pravaah uses the supplied workspace Lottie with a reduced-motion fallback", async () => {
  const animation = await readFile(
    path.join(
      webRoot,
      "src/features/pravaah/components/pravaah-network-animation.tsx",
    ),
    "utf8",
  );
  assert.match(animation, /interactive-workspace-premium\.json/);
  assert.match(animation, /assetsPath/);
  assert.match(animation, /prefers-reduced-motion:\s*reduce/);
  assert.match(animation, /goToAndStop/);
  assert.match(animation, /renderer:\s*"svg"/);
  assert.match(animation, /progressiveLoad:\s*true/);

  const assetRoot = path.join(
    webRoot,
    "public/animations/pravaah/interactive-workspace",
  );
  const definition = JSON.parse(
    await readFile(
      path.join(assetRoot, "interactive-workspace-premium.json"),
      "utf8",
    ),
  ) as { assets?: Array<{ p?: string; u?: string }> };
  const imageAssets = definition.assets ?? [];

  assert.equal(imageAssets.length, 6);
  await Promise.all(
    imageAssets.map((asset) =>
      readFile(path.join(assetRoot, asset.u ?? "", asset.p ?? "")),
    ),
  );
});
