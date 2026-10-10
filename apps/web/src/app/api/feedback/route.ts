import { z } from "zod";
import {
  acceptAevaFeedbackRequest,
  hasValidAevaOrigin,
} from "@/features/aeva/server/aeva-guard";
import { redactAevaText } from "@/features/aeva/server/encryption";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import { callPublishingService } from "@/features/publishing/server/publishing-service";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

const schema = z
  .object({
    responseId: z.string().uuid(),
    kind: z.enum(["feedback", "report"]).default("feedback"),
    reason: z.enum([
      "helpful",
      "not-helpful",
      "incorrect",
      "too-much-detail",
      "not-enough-detail",
      "privacy-concern",
      "irrelevant",
      "unsafe",
      "broken-conversation",
      "other",
    ]),
    comment: z.string().trim().max(500).optional(),
    page: z.string().trim().max(300).default("/aeva"),
    policyVersion: z.literal(POLICY_VERSIONS.aeva),
    includeTranscript: z.boolean().default(false),
    transcript: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: z.string().trim().min(1).max(1_000),
          })
          .strict(),
      )
      .max(8)
      .optional(),
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
    input = schema.parse(await readJsonBody(request, 12_000));
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
    const transcriptConsented =
      input.kind === "report" && input.includeTranscript;
    const reportExcerpt = transcriptConsented
      ? input.transcript
          ?.map(
            (turn) =>
              `${turn.role.toUpperCase()}: ${redactAevaText(turn.text)}`,
          )
          .filter((turn) => !turn.endsWith(": "))
          .join("\n")
          .slice(0, 4_000)
      : undefined;
    const result = await callPublishingService("feedback_submit", {
      kind: input.kind,
      rating,
      reason: input.reason,
      responseId: input.responseId,
      message: input.comment,
      page: input.page,
      policyVersion: input.policyVersion,
      transcriptConsented,
      reportExcerpt,
      priority:
        input.reason === "privacy-concern" || input.reason === "unsafe"
          ? "urgent"
          : "normal",
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
          "Feedback could not be confirmed. Please try again shortly. A consented excerpt may already have reached the service.",
      },
      { status: 503 },
    );
  }
}
