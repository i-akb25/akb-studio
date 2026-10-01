import { createHmac } from "node:crypto";
import { z } from "zod";
import { JOURNEY_CATEGORIES } from "@/features/analytics/model";
import { prisma } from "@/server/db/prisma";
import { consumeRateLimit } from "@/server/security/rate-limit";
import {
  hasTrustedOrigin,
  RequestSecurityError,
  readJsonBody,
} from "@/server/security/request";

export const runtime = "nodejs";

const inputSchema = z
  .object({
    event: z.enum(["view", "duration"]),
    anonymousSessionId: z.string().uuid(),
    category: z.enum(JOURNEY_CATEGORIES),
    projectSlug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120)
      .optional(),
    seconds: z.number().int().min(1).max(1_800).optional(),
  })
  .strict()
  .refine((value) => value.event === "view" || value.seconds !== undefined);

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return new Response(null, { status: 403 });
  const secret = process.env.ANALYTICS_HASH_SECRET;
  if (!secret || secret.length < 32) return new Response(null, { status: 503 });
  let body: unknown;
  try {
    body = await readJsonBody(request, 2_048);
  } catch (error) {
    return new Response(null, {
      status: error instanceof RequestSecurityError ? error.status : 400,
    });
  }
  const input = inputSchema.safeParse(body);
  if (!input.success) return new Response(null, { status: 400 });
  const sessionHash = createHmac("sha256", secret)
    .update(input.data.anonymousSessionId)
    .digest("hex");
  const limit = await consumeRateLimit({
    scope: "analytics:journey",
    identifier: sessionHash,
    limit: 240,
    windowMs: 60 * 60 * 1_000,
  });
  if (!limit.allowed) return new Response(null, { status: 429 });

  const now = new Date();
  const retentionUntil = new Date(now.getTime() + 30 * 86_400_000);
  await prisma.$transaction(async (database) => {
    await database.anonymousJourney.deleteMany({
      where: { retentionUntil: { lt: now } },
    });
    const current = await database.anonymousJourney.findUnique({
      where: { sessionHash },
    });
    const categories = Array.from(
      new Set([...(current?.categories ?? []), input.data.category]),
    );
    const projectSlugs = Array.from(
      new Set([
        ...(current?.projectSlugs ?? []),
        ...(input.data.projectSlug ? [input.data.projectSlug] : []),
      ]),
    );
    await database.anonymousJourney.upsert({
      where: { sessionHash },
      create: {
        sessionHash,
        categories,
        projectSlugs,
        pageCount: input.data.event === "view" ? 1 : 0,
        totalSeconds: input.data.seconds ?? 0,
        retentionUntil,
      },
      update: {
        categories,
        projectSlugs,
        pageCount: { increment: input.data.event === "view" ? 1 : 0 },
        totalSeconds: { increment: input.data.seconds ?? 0 },
        lastSeenAt: now,
        retentionUntil,
      },
    });
  });
  return new Response(null, { status: 204 });
}
