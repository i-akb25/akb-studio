import { z } from "zod";
import { recordAnalyticsMetric } from "@/server/analytics/metrics";
import { consumeRateLimit } from "@/server/security/rate-limit";
import {
  clientAddress,
  hasTrustedOrigin,
  RequestSecurityError,
  readJsonBody,
} from "@/server/security/request";

const inputSchema = z
  .object({
    scope: z.enum(["public-boundary", "project-boundary"]),
    route: z.enum([
      "home",
      "projects",
      "journal",
      "knowledge",
      "pravaah",
      "about",
      "resume",
      "lab",
      "aeva",
      "contact",
      "other",
    ]),
  })
  .strict();

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) return new Response(null, { status: 403 });
  const limit = await consumeRateLimit({
    scope: "monitoring:error",
    identifier: clientAddress(request),
    limit: 20,
    windowMs: 60 * 60 * 1_000,
  });
  if (!limit.allowed) return new Response(null, { status: 429 });
  let body: unknown;
  try {
    body = await readJsonBody(request, 1_024);
  } catch (error) {
    return new Response(null, {
      status: error instanceof RequestSecurityError ? error.status : 400,
    });
  }
  const input = inputSchema.safeParse(body);
  if (!input.success) return new Response(null, { status: 400 });
  await recordAnalyticsMetric({
    kind: "client_error",
    target: input.data.route,
    failed: true,
  });
  return new Response(null, { status: 204 });
}
