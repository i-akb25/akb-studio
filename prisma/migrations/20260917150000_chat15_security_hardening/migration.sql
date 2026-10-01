CREATE TABLE "SecurityRateLimit" (
  "key" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SecurityRateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "SecurityRateLimit_scope_expiresAt_idx"
  ON "SecurityRateLimit"("scope", "expiresAt");
CREATE INDEX "SecurityRateLimit_expiresAt_idx"
  ON "SecurityRateLimit"("expiresAt");

ALTER TABLE "AuditLog" ADD COLUMN "previousHash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "entryHash" TEXT;
CREATE UNIQUE INDEX "AuditLog_entryHash_key" ON "AuditLog"("entryHash");

-- Raw session addresses are outside the portfolio's stated data boundary.
UPDATE "Session" SET "ipAddress" = NULL;
