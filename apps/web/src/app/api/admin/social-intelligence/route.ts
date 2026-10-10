import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertSameOrigin,
  canAdmin,
  getAdminSession,
} from "@/features/admin/server/admin-auth";
import { verifyGitHubSocialAccess } from "@/features/social-intelligence/server/github-verifier";
import { socialIntelligenceSnapshot } from "@/features/social-intelligence/server/manifest";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

export const runtime = "nodejs";

const requestSchema = z.object({
  action: z.literal("verify-github"),
});

export async function POST(request: Request) {
  if (!(await canAdmin("users:manage"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await consumeRateLimit({
    scope: "admin-social-verification",
    identifier: session.user.id,
    limit: 6,
    windowMs: 10 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Verification is temporarily limited. Try again later." },
      {
        status: limit.available ? 429 : 503,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(limit.retryAfter),
        },
      },
    );
  }

  try {
    requestSchema.parse(await readJsonBody(request, 2_048));
    const verification = await verifyGitHubSocialAccess();
    return NextResponse.json(
      {
        snapshot: socialIntelligenceSnapshot(),
        verification,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: "Provider verification failed safely. No external data changed.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
