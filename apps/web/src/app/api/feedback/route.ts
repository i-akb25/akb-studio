import { z } from "zod";
import {
  acceptAevaRequest,
  hasValidAevaOrigin,
} from "@/features/aeva/server/aeva-guard";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const schema = z
  .object({
    rating: z.enum(["helpful", "not-helpful", "mixed"]),
    message: z.string().trim().max(1_000).optional(),
    conversationId: z.string().uuid().optional(),
    page: z.string().trim().max(300).default("/aeva"),
    policyVersion: z.literal(POLICY_VERSIONS.aeva),
  })
  .strict();

export async function POST(request: Request) {
  if (!hasValidAevaOrigin(request))
    return Response.json({ error: "Invalid request" }, { status: 403 });
  if (!(await acceptAevaRequest(request)))
    return Response.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await readJsonBody(request, 4_096));
  } catch (error) {
    return Response.json(
      { error: "Invalid feedback" },
      { status: error instanceof RequestSecurityError ? error.status : 400 },
    );
  }
  try {
    const result = await callPublishingService("feedback_submit", input);
    if (!result.ok) throw new Error("feedback_unavailable");
    return Response.json({
      ok: true,
      message: "Thank you. Your feedback was received.",
    });
  } catch {
    return Response.json(
      {
        error:
          "Feedback is temporarily unavailable. No conversation was exposed.",
      },
      { status: 503 },
    );
  }
}
