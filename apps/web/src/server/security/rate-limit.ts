import "server-only";

import { createHmac } from "node:crypto";
import { Prisma } from "@generated/prisma/client";
import { prisma } from "@/server/db/prisma";

type RateLimitDecision = { allowed: boolean; retryAfter: number; key: string };

function secret(): string {
  const configured =
    process.env.ABUSE_HASH_SECRET?.trim() ||
    process.env.CONTACT_ABUSE_HASH_SECRET?.trim() ||
    process.env.AEVA_ABUSE_HASH_SECRET?.trim();
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production")
    throw new Error("ABUSE_HASH_SECRET must contain at least 32 characters");
  return "development-only-abuse-secret-change-before-production";
}

export function rateLimitKey(scope: string, value: string): string {
  return createHmac("sha256", secret())
    .update(`${scope}:${value}`)
    .digest("hex");
}

export async function consumeRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitDecision> {
  let key: string;
  try {
    key = rateLimitKey(input.scope, input.identifier);
  } catch {
    return { allowed: false, retryAfter: 60, key: "" };
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + input.windowMs);
  try {
    const rows = await prisma.$queryRaw<
      Array<{ count: number; expiresAt: Date }>
    >(Prisma.sql`
      INSERT INTO "SecurityRateLimit" ("key", "scope", "count", "windowStartedAt", "expiresAt")
      VALUES (${key}, ${input.scope}, 1, ${now}, ${expiresAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "SecurityRateLimit"."expiresAt" <= ${now} THEN 1
          ELSE "SecurityRateLimit"."count" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "SecurityRateLimit"."expiresAt" <= ${now} THEN ${now}
          ELSE "SecurityRateLimit"."windowStartedAt"
        END,
        "expiresAt" = CASE
          WHEN "SecurityRateLimit"."expiresAt" <= ${now} THEN ${expiresAt}
          ELSE "SecurityRateLimit"."expiresAt"
        END
      RETURNING "count", "expiresAt"
    `);
    const row = rows[0];
    if (!row) return { allowed: false, retryAfter: 60, key };
    return {
      allowed: row.count <= input.limit,
      retryAfter: Math.max(
        1,
        Math.ceil((new Date(row.expiresAt).getTime() - now.getTime()) / 1_000),
      ),
      key,
    };
  } catch {
    return { allowed: false, retryAfter: 60, key };
  }
}

export async function releaseRateLimit(key: string | undefined): Promise<void> {
  if (!key) return;
  await prisma.securityRateLimit.delete({ where: { key } }).catch(() => {});
}
