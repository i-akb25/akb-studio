-- CreateEnum
CREATE TYPE "ContactDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AevaMemoryVisibility" AS ENUM ('PUBLIC_AEVA', 'RESPONSE_POLICY', 'OWNER_ONLY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AevaSourceKind" AS ENUM ('ABOUT', 'PROJECT', 'JOURNAL', 'KNOWLEDGE', 'PRAVAAH', 'OWNER_URL');

-- CreateEnum
CREATE TYPE "AevaMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- AlterTable
ALTER TABLE "ContactSubmission"
  ADD COLUMN "deliveryStatus" "ContactDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "gmailMessageId" TEXT,
  ADD COLUMN "deliveryAttemptCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deliveryLastError" TEXT,
  ADD COLUMN "deliveryLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "gmailDispositionAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MediaAsset"
  ADD COLUMN "originalName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_checksum_key" ON "MediaAsset"("checksum");

-- CreateTable
CREATE TABLE "MediaExtraction" (
  "id" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "plainText" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AevaMemory" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "visibility" "AevaMemoryVisibility" NOT NULL DEFAULT 'OWNER_ONLY',
  "state" "ContentState" NOT NULL DEFAULT 'DRAFT',
  "sourceLabel" TEXT,
  "sourceUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AevaMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AevaSource" (
  "id" TEXT NOT NULL,
  "kind" "AevaSourceKind" NOT NULL DEFAULT 'OWNER_URL',
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "notes" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "publicAllowed" BOOLEAN NOT NULL DEFAULT true,
  "lastCheckedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AevaSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AevaConversation" (
  "id" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'general',
  "shared" BOOLEAN NOT NULL DEFAULT false,
  "retentionUntil" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AevaConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AevaMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "AevaMessageRole" NOT NULL,
  "encryptedBody" TEXT NOT NULL,
  "citations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AevaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AevaKnowledgeGap" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "encryptedQuestion" TEXT,
  "sampleConsented" BOOLEAN NOT NULL DEFAULT false,
  "occurrences" INTEGER NOT NULL DEFAULT 1,
  "status" TEXT NOT NULL DEFAULT 'open',
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AevaKnowledgeGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AevaIncident" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "occurrences" INTEGER NOT NULL DEFAULT 1,
  "context" JSONB,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "AevaIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaExtraction_mediaAssetId_key" ON "MediaExtraction"("mediaAssetId");
CREATE INDEX "MediaExtraction_contentHash_idx" ON "MediaExtraction"("contentHash");
CREATE INDEX "AevaMemory_visibility_state_order_idx" ON "AevaMemory"("visibility", "state", "order");
CREATE UNIQUE INDEX "AevaSource_url_key" ON "AevaSource"("url");
CREATE INDEX "AevaSource_enabled_publicAllowed_idx" ON "AevaSource"("enabled", "publicAllowed");
CREATE UNIQUE INDEX "AevaConversation_publicId_key" ON "AevaConversation"("publicId");
CREATE INDEX "AevaConversation_retentionUntil_idx" ON "AevaConversation"("retentionUntil");
CREATE INDEX "AevaMessage_conversationId_createdAt_idx" ON "AevaMessage"("conversationId", "createdAt");
CREATE UNIQUE INDEX "AevaKnowledgeGap_fingerprint_key" ON "AevaKnowledgeGap"("fingerprint");
CREATE INDEX "AevaKnowledgeGap_status_lastSeenAt_idx" ON "AevaKnowledgeGap"("status", "lastSeenAt");
CREATE UNIQUE INDEX "AevaIncident_kind_code_key" ON "AevaIncident"("kind", "code");
CREATE INDEX "AevaIncident_resolvedAt_lastSeenAt_idx" ON "AevaIncident"("resolvedAt", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "MediaExtraction" ADD CONSTRAINT "MediaExtraction_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AevaMessage" ADD CONSTRAINT "AevaMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AevaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
