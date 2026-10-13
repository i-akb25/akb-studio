import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");

test("anonymous journeys cannot be joined to contact identity", async () => {
  const schema = await readFile(
    path.join(root, "../../prisma/schema.prisma"),
    "utf8",
  );
  const model =
    schema.match(/model AnonymousJourney \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(model, /sessionHash/);
  assert.match(model, /retentionUntil/);
  assert.doesNotMatch(
    model,
    /ContactSubmission|email|name|ipAddress|userAgent/,
  );
});

test("analytics accepts only normalized public categories", async () => {
  const route = await readFile(
    path.join(root, "src/app/api/analytics/journey/route.ts"),
    "utf8",
  );
  assert.match(route, /JOURNEY_CATEGORIES/);
  assert.match(route, /"heartbeat"/);
  assert.doesNotMatch(route, /clientAddress|x-forwarded-for|user-agent/i);
});

test("live visitor activity remains anonymous and consent gated", async () => {
  const [tracker, admin, migration] = await Promise.all([
    readFile(
      path.join(root, "src/features/analytics/components/journey-tracker.tsx"),
      "utf8",
    ),
    readFile(
      path.join(root, "src/app/admin/(protected)/analytics/page.tsx"),
      "utf8",
    ),
    readFile(
      path.join(
        root,
        "../../prisma/migrations/20261013100000_live_anonymous_journeys/migration.sql",
      ),
      "utf8",
    ),
  ]);
  assert.match(tracker, /hasAnalyticsConsent/);
  assert.match(tracker, /event: "heartbeat"/);
  assert.match(admin, /Anonymous visitor activity/);
  assert.match(admin, /consented browser sessions, not identified people/);
  assert.doesNotMatch(admin, /email|ipAddress|userAgent/);
  assert.match(migration, /ALTER TABLE "AnonymousJourney"/);
  assert.doesNotMatch(migration, /\b(?:DROP|DELETE|TRUNCATE)\b/i);
});

test("follow-up reminders require explicit unwithdrawn consent", async () => {
  const route = await readFile(
    path.join(root, "src/app/api/admin/studio/route.ts"),
    "utf8",
  );
  assert.match(route, /consentType: "follow_up_reminder"/);
  assert.match(route, /granted: true/);
  assert.match(route, /withdrawnAt: null/);
});
