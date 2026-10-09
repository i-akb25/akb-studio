import { z } from "zod";
import {
  acceptAevaFeedbackRequest,
  hasValidAevaOrigin,
} from "@/features/aeva/server/aeva-guard";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const schema = z
  .object({
    responseId: z.string().uuid(),
    reason: z.enum([
      "helpful",
      "not-helpful",
      "incorrect",
      "too-much-detail",
      "not-enough-detail",
      "privacy-concern",
    ]),
    comment: z.string().trim().max(500).optional(),
    page: z.string().trim().max(300).default("/aeva"),
    policyVersion: z.literal(POLICY_VERSIONS.aeva),
  })
  .strict();

export async function POST(request: Request) {
  if (!hasValidAevaOrigin(request))
    return Response.json({ error: "Invalid request" }, { status: 403 });
  if (!(await acceptAevaFeedbackRequest(request)))
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
    const rating =
      input.reason === "helpful"
        ? "helpful"
        : input.reason === "not-helpful"
          ? "not-helpful"
          : "mixed";
    const result = await callPublishingService("feedback_submit", {
      rating,
      reason: input.reason,
      responseId: input.responseId,
      message: input.comment,
      page: input.page,
      policyVersion: input.policyVersion,
      priority: input.reason === "privacy-concern" ? "urgent" : "normal",
    });
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
