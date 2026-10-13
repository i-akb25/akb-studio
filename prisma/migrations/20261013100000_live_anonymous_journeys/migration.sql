ALTER TABLE "AnonymousJourney"
  ADD COLUMN "lastCategory" TEXT,
  ADD COLUMN "lastProjectSlug" TEXT;

CREATE INDEX "AnonymousJourney_lastSeenAt_lastCategory_idx"
  ON "AnonymousJourney"("lastSeenAt", "lastCategory");
