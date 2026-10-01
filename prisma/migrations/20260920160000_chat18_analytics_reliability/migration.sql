CREATE TABLE "AnalyticsMetric" (
  "id" TEXT NOT NULL,
  "capturedOn" DATE NOT NULL,
  "kind" TEXT NOT NULL,
  "target" TEXT NOT NULL DEFAULT '',
  "count" INTEGER NOT NULL DEFAULT 0,
  "totalValue" INTEGER NOT NULL DEFAULT 0,
  "failures" INTEGER NOT NULL DEFAULT 0,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalHealth" (
  "key" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "summary" TEXT,
  "latencyMs" INTEGER,
  "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  "lastSuccessAt" TIMESTAMP(3),
  "lastFailureAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationalHealth_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "SiteAudioSetting" (
  "id" TEXT NOT NULL DEFAULT 'portfolio',
  "assetId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "artist" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteAudioSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsMetric_capturedOn_kind_target_key" ON "AnalyticsMetric"("capturedOn", "kind", "target");
CREATE INDEX "AnalyticsMetric_kind_capturedOn_idx" ON "AnalyticsMetric"("kind", "capturedOn");
CREATE INDEX "AnalyticsMetric_capturedOn_idx" ON "AnalyticsMetric"("capturedOn");
CREATE INDEX "OperationalHealth_status_lastCheckedAt_idx" ON "OperationalHealth"("status", "lastCheckedAt");
CREATE UNIQUE INDEX "SiteAudioSetting_assetId_key" ON "SiteAudioSetting"("assetId");

ALTER TABLE "SiteAudioSetting" ADD CONSTRAINT "SiteAudioSetting_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
