CREATE TABLE "PravaahRegistry" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "manifest" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PravaahRegistry_pkey" PRIMARY KEY ("id")
);
