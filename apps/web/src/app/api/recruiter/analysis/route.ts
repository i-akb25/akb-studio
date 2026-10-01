import { z } from "zod";
import { hasValidAevaOrigin } from "@/features/aeva/server/aeva-guard";
import { analyzePublishedRoleFit } from "@/features/recruiter/server/role-fit";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

export const runtime = "nodejs";

const inputSchema = z
  .object({ jobDescription: z.string().trim().min(40).max(8_000) })
  .strict();

function clientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: Request) {
  if (!hasValidAevaOrigin(request))
    return new Response("Invalid request", { status: 403 });
  const rateLimit = await consumeRateLimit({
    scope: "recruiter:analysis",
    identifier: clientAddress(request),
    limit: 8,
    windowMs: 15 * 60 * 1_000,
  });
  if (!rateLimit.allowed)
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfter) },
    });

  try {
    const input = inputSchema.parse(await readJsonBody(request, 12_000));
    const analysis = await analyzePublishedRoleFit(input.jobDescription);
    return Response.json(
      { ok: true, analysis },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return new Response("Invalid request", {
      status: error instanceof RequestSecurityError ? error.status : 400,
    });
  }
}
