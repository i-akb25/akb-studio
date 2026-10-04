CREATE TABLE "SiteConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "siteName" TEXT NOT NULL DEFAULT 'AKB Studio',
    "authorName" TEXT NOT NULL DEFAULT 'Anurag Kumar Bharti',
    "description" TEXT NOT NULL,
    "professionalEmail" TEXT NOT NULL,
    "generalEmail" TEXT NOT NULL,
    "socialImageAssetId" TEXT,
    "socialImageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfiguration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteConfiguration_socialImageAssetId_idx"
ON "SiteConfiguration"("socialImageAssetId");

ALTER TABLE "SiteConfiguration"
ADD CONSTRAINT "SiteConfiguration_socialImageAssetId_fkey"
FOREIGN KEY ("socialImageAssetId") REFERENCES "MediaAsset"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
