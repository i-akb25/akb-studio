import { createHmac } from "node:crypto";
import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/features/analytics/model";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { recordAnalyticsMetric } from "@/server/analytics/metrics";
import { consumeRateLimit } from "@/server/security/rate-limit";
import {
  hasTrustedOrigin,
  RequestSecurityError,
  readJsonBody,
} from "@/server/security/request";

export const runtime = "nodejs";

const inputSchema = z
  .object({
    event: z.enum(ANALYTICS_EVENTS),
    anonymousSessionId: z.string().uuid(),
    target: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120)
      .optional(),
    consentVersion: z.literal(POLICY_VERSIONS.cookies),
  })
  .strict();

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
  const identifier = createHmac("sha256", secret)
    .update(input.data.anonymousSessionId)
    .digest("hex");
  const limit = await consumeRateLimit({
    scope: "analytics:conversion",
    identifier,
    limit: 120,
    windowMs: 60 * 60 * 1_000,
  });
  if (!limit.allowed) return new Response(null, { status: 429 });
  await recordAnalyticsMetric({
    kind: input.data.event,
    target: input.data.target,
  });
  return new Response(null, { status: 204 });
}
