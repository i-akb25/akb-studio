import { z } from "zod";
import {
  assertSameOrigin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { aevaCapabilities } from "@/features/aeva/capabilities/registry";
import { aevaServerConfig } from "@/features/aeva/config/server-config";
import {
  generatePrivateAevaAnswer,
  privateAevaFallback,
} from "@/features/aeva/private/provider";
import { retrievePrivateAevaContext } from "@/features/aeva/private/retrieval";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

export const runtime = "nodejs";

const inputSchema = z
  .object({
    question: z.string().trim().min(2).max(1_000),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: z.string().trim().min(1).max(1_000),
          })
          .strict(),
      )
      .max(8)
      .default([]),
  })
  .strict();

const BLOCKED_PRIVATE_REQUEST =
  /(?:reveal|print|repeat|expose|export).{0,50}(?:system prompt|developer message|credential|secret|environment variable|token|password|authentication record|contact submission|audit log)|(?:ignore|override|bypass|disregard).{0,50}(?:instruction|policy|restriction)/i;

export async function POST(request: Request) {
  if (
    !aevaServerConfig.privateEnabled ||
    !aevaCapabilities.private.privateRetrieval
  )
    return Response.json(
      { error: "Private Aeva is disabled." },
      { status: 503 },
    );
  const session = await getAdminSession();
  if (!session?.user.twoFactorEnabled)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    assertSameOrigin(request);
  } catch {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const limit = await consumeRateLimit({
    scope: "aeva:private:owner",
    identifier: session.user.id,
    limit: 30,
    windowMs: 15 * 60 * 1_000,
  });
  if (!limit.available)
    return Response.json(
      { error: "Private Aeva cannot verify its request limit." },
      { status: 503 },
    );
  if (!limit.allowed)
    return Response.json(
      { error: "Too many private Aeva requests." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await readJsonBody(request, 12_000));
  } catch (error) {
    return Response.json(
      { error: "Invalid private Aeva request." },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }
  if (BLOCKED_PRIVATE_REQUEST.test(input.question))
    return Response.json({
      ok: true,
      answer:
        "That request crosses the private assistant boundary. Private Aeva does not expose prompts, credentials, authentication records, contacts or audit logs.",
      references: [],
      grounded: false,
      storage: "browser",
    });
  try {
    const sources = await retrievePrivateAevaContext(input.question);
    const provider = await generatePrivateAevaAnswer({
      userId: session.user.id,
      question: input.question,
      history: input.history,
      sources,
    });
    const result = provider ?? privateAevaFallback(sources);
    return Response.json({
      ok: true,
      ...result,
      grounded: Boolean(provider),
      storage: "browser",
    });
  } catch {
    return Response.json(
      { error: "Private Aeva is temporarily unavailable." },
      { status: 503 },
    );
  }
}
