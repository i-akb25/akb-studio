CREATE TYPE "FollowUpState" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SuggestionState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "ContactNote" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactMeeting" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "summary" TEXT NOT NULL,
  "nextStep" TEXT,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactMeeting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FollowUpReminder" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT NOT NULL,
  "state" "FollowUpState" NOT NULL DEFAULT 'PENDING',
  "actorId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowUpReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnonymousJourney" (
  "id" TEXT NOT NULL,
  "sessionHash" TEXT NOT NULL,
  "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "projectSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "pageCount" INTEGER NOT NULL DEFAULT 0,
  "totalSeconds" INTEGER NOT NULL DEFAULT 0,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnonymousJourney_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudioSuggestion" (
  "id" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "proposedAction" TEXT NOT NULL,
  "evidence" JSONB,
  "state" "SuggestionState" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecoveryVerification" (
  "id" TEXT NOT NULL,
  "backupLabel" TEXT NOT NULL,
  "backupCreatedAt" TIMESTAMP(3) NOT NULL,
  "restoreTestedAt" TIMESTAMP(3) NOT NULL,
  "outcome" TEXT NOT NULL,
  "notes" TEXT,
  "actorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecoveryVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnonymousJourney_sessionHash_key" ON "AnonymousJourney"("sessionHash");
CREATE INDEX "ContactNote_submissionId_createdAt_idx" ON "ContactNote"("submissionId", "createdAt");
CREATE INDEX "ContactMeeting_submissionId_occurredAt_idx" ON "ContactMeeting"("submissionId", "occurredAt");
CREATE INDEX "FollowUpReminder_state_dueAt_idx" ON "FollowUpReminder"("state", "dueAt");
CREATE INDEX "FollowUpReminder_submissionId_createdAt_idx" ON "FollowUpReminder"("submissionId", "createdAt");
CREATE INDEX "AnonymousJourney_lastSeenAt_idx" ON "AnonymousJourney"("lastSeenAt");
CREATE INDEX "AnonymousJourney_retentionUntil_idx" ON "AnonymousJourney"("retentionUntil");
CREATE INDEX "StudioSuggestion_state_createdAt_idx" ON "StudioSuggestion"("state", "createdAt");
CREATE INDEX "RecoveryVerification_restoreTestedAt_idx" ON "RecoveryVerification"("restoreTestedAt");

ALTER TABLE "ContactNote" ADD CONSTRAINT "ContactNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactMeeting" ADD CONSTRAINT "ContactMeeting_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUpReminder" ADD CONSTRAINT "FollowUpReminder_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
