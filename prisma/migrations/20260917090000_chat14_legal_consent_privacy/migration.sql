-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION', 'CONSENT_WITHDRAWAL', 'GRIEVANCE', 'ACCOUNT_DELETION', 'CONTENT_DELETION', 'NOMINATION');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('RECEIVED', 'VERIFYING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "ConsentRecord"
  ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'contact_enquiry',
  ADD COLUMN "evidence" JSONB,
  ADD COLUMN "verificationTokenHash" TEXT,
  ADD COLUMN "verificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "withdrawnAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "AevaConversation" ADD COLUMN "consentVersion" TEXT;

-- AlterTable
ALTER TABLE "AevaKnowledgeGap" ADD COLUMN "consentVersion" TEXT;
ALTER TABLE "AevaKnowledgeGap" ADD COLUMN "sampleRetentionUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "type" "PrivacyRequestType" NOT NULL,
  "details" TEXT NOT NULL,
  "relatedReference" TEXT,
  "resourceUrl" TEXT,
  "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'RECEIVED',
  "policyVersion" TEXT NOT NULL,
  "responseDueAt" TIMESTAMP(3) NOT NULL,
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "deliveryStatus" "ContactDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "gmailMessageId" TEXT,
  "deliveryAttemptCount" INTEGER NOT NULL DEFAULT 0,
  "deliveryLastError" TEXT,
  "deliveryLastAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_verificationTokenHash_key" ON "ConsentRecord"("verificationTokenHash");
CREATE INDEX "ConsentRecord_verificationExpiresAt_idx" ON "ConsentRecord"("verificationExpiresAt");
CREATE UNIQUE INDEX "PrivacyRequest_reference_key" ON "PrivacyRequest"("reference");
CREATE INDEX "PrivacyRequest_status_responseDueAt_idx" ON "PrivacyRequest"("status", "responseDueAt");
CREATE INDEX "PrivacyRequest_retentionUntil_idx" ON "PrivacyRequest"("retentionUntil");
CREATE INDEX "PrivacyRequest_email_createdAt_idx" ON "PrivacyRequest"("email", "createdAt");
CREATE INDEX "AevaKnowledgeGap_sampleRetentionUntil_idx" ON "AevaKnowledgeGap"("sampleRetentionUntil");
