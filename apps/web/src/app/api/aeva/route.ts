import { randomUUID } from "node:crypto";
import { z } from "zod";
import { aevaServerConfig } from "@/features/aeva/config/server-config";
import { directAevaResponse } from "@/features/aeva/core/direct-response";
import { groundedFallbackAnswer } from "@/features/aeva/core/grounded-answer";
import { understandAevaQuery } from "@/features/aeva/core/query-understanding";
import {
  clampWords,
  createResponseContract,
  resolveFollowUpQuestion,
} from "@/features/aeva/core/response-contract";
import {
  createAevaActions,
  normalizeAevaPageContext,
} from "@/features/aeva/core/site-awareness";
import {
  classifyAevaIntent,
  conversationalReply,
  isCurrentActivityQuestion,
  retrievalQuery,
} from "@/features/aeva/intent";
import {
  AEVA_MODES,
  type AevaAnswer,
  type AevaIntent,
  type AevaMode,
} from "@/features/aeva/model";
import {
  acceptAevaRequest,
  hasValidAevaOrigin,
  isPrivateLifeQuestion,
  isPromptInjection,
} from "@/features/aeva/server/aeva-guard";
import { getPublishedCurrentStatus } from "@/features/aeva/server/current-status";
import {
  recordKnowledgeGap,
  saveSharedExchange,
} from "@/features/aeva/server/persistence";
import { generateProviderAnswer } from "@/features/aeva/server/provider";
import {
  citationFromCandidate,
  deduplicateAevaCitations,
  retrieveAevaContext,
} from "@/features/aeva/server/retrieval";
import { POLICY_VERSIONS } from "@/features/legal/policy-registry";
import type { RoleFitAnalysis } from "@/features/recruiter/model";
import { analyzePublishedRoleFit } from "@/features/recruiter/server/role-fit";
import { recordAnalyticsMetric } from "@/server/analytics/metrics";
import { logger, safeErrorFields } from "@/server/logging/logger";
import { RequestSecurityError, readJsonBody } from "@/server/security/request";

export const runtime = "nodejs";
const inputSchema = z
  .object({
    question: z.string().trim().min(2).max(1_000),
    mode: z.enum(AEVA_MODES).default("explore"),
    allowWeb: z.boolean().default(false),
    shareConversation: z.boolean().default(false),
    shareUnknownQuestion: z.boolean().default(false),
    conversationId: z.string().uuid().optional(),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            text: z.string().trim().min(1).max(1_000),
          })
          .strict(),
      )
      .max(aevaServerConfig.maxConversationTurns)
      .default([]),
    pageContext: z
      .object({
        path: z.string().trim().startsWith("/").max(300),
        title: z.string().trim().max(160).optional(),
        sectionId: z
          .string()
          .trim()
          .regex(/^[a-z0-9][a-z0-9-_]{0,79}$/i)
          .optional(),
        sectionLabel: z.string().trim().max(120).optional(),
      })
      .strict()
      .optional(),
    jobDescription: z.string().trim().min(40).max(8_000).optional(),
    policyVersion: z.literal(POLICY_VERSIONS.aeva),
  })
  .strict();

function followUps(
  intent: AevaIntent,
  mode: AevaMode,
  grounded: boolean,
): string[] {
  if (intent === "conversation")
    return [
      "Show me Anurag's strongest projects.",
      "What kind of engineering work does he do?",
    ];
  if (intent === "role-fit")
    return [
      "Start a role-grounded interview.",
      "Which evidence should I inspect first?",
    ];
  if (!grounded)
    return [
      "Would you like to share this question anonymously as a knowledge gap?",
      "Should I search the live web instead?",
    ];
  return mode === "recruiter"
    ? [
        "Which project best demonstrates production engineering?",
        "What evidence is available for Anurag's cross-disciplinary work?",
      ]
    : [
        "Would you like the project evidence or the engineering decisions next?",
        "Should I narrow this to software, electrical, automation, or AI work?",
      ];
}

function roleFitAnswer(analysis: RoleFitAnalysis): string {
  const strengths = analysis.strengths
    .slice(0, 5)
    .map(
      (item) =>
        `• ${item.requirement}: ${item.evidence.map((evidence) => evidence.title).join(", ")}`,
    );
  const gaps = analysis.gaps.length
    ? `\n\nNot evidenced in the published portfolio: ${analysis.gaps.join(", ")}.`
    : "";
  return `${analysis.summary}\n\nPublished strengths:\n${strengths.join("\n") || "No explicit technical requirement matched the current evidence."}${gaps}`;
}

export async function POST(request: Request) {
  if (!aevaServerConfig.publicEnabled) {
    return Response.json(
      {
        error:
          "Aeva is temporarily unavailable while its public knowledge boundary is verified.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!hasValidAevaOrigin(request))
    return new Response("Invalid request", { status: 403 });
  if (!(await acceptAevaRequest(request)))
    return new Response("Too many requests", {
      status: 429,
      headers: { "Retry-After": "900" },
    });
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await readJsonBody(request, 24_000));
  } catch (error) {
    return new Response("Invalid request", {
      status: error instanceof RequestSecurityError ? error.status : 400,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (value: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(value)}\n\n`),
        );
      const requestId = randomUUID();
      try {
        send({ type: "status", message: "Looking through the portfolio" });
        let answer = "";
        let citations: AevaAnswer["citations"] = [];
        let grounded = false;
        let usedWeb = false;
        let usedVerifiedSourceFallback = false;
        const pageContext = normalizeAevaPageContext(input.pageContext);
        const intent = classifyAevaIntent({
          question: input.question,
          mode: input.mode,
          pageContext,
          history: input.history,
        });
        const contract = createResponseContract(intent, input.mode);
        const resolvedQuestion = resolveFollowUpQuestion(
          input.question,
          input.history,
        );
        const queryPlan = understandAevaQuery({
          question: retrievalQuery(resolvedQuestion, intent, pageContext),
          intent,
          mode: input.mode,
        });
        const promptInjection = isPromptInjection(input.question);
        const privateLifeQuestion = isPrivateLifeQuestion(input.question);
        const blockedRequest = promptInjection || privateLifeQuestion;
        const directResponse = directAevaResponse(input.question);

        if (promptInjection) {
          answer =
            "I can't reveal private instructions, secrets, admin data, or bypass my source boundaries. I can still help with Ace's public work or a general web question.";
        } else if (privateLifeQuestion) {
          answer =
            "Cute question, but I don't gossip on Ace's behalf. If he has not deliberately published something, I will not invent it. I can happily tell you about his work, interests, projects, or current engineering focus instead.";
        } else if (directResponse) {
          answer = directResponse.answer;
        } else if (intent === "conversation") {
          answer =
            conversationalReply(input.question, input.history) ??
            "I’m here. What would you like to explore?";
        } else if (isCurrentActivityQuestion(input.question)) {
          const status = await getPublishedCurrentStatus();
          if (status) {
            answer = status.answer;
            citations = [status.citation];
            grounded = true;
          } else {
            answer =
              "Anurag has not published a current activity update with a valid expiry time. I won’t infer his location, calendar or live activity.";
          }
        } else if (intent === "live-information" && !input.allowWeb) {
          answer =
            "That answer can change, so I need live web grounding to answer it reliably. Enable live web and ask again. If the place or office is ambiguous, include the city, timezone, country or state.";
        } else if (intent === "role-fit" && input.jobDescription) {
          const analysis = await analyzePublishedRoleFit(input.jobDescription);
          answer = clampWords(roleFitAnswer(analysis), contract.maxWords);
          citations = analysis.relevantEvidence
            .slice(0, contract.maxCitations)
            .map((evidence) => ({
              id: evidence.id,
              title: evidence.title,
              url: evidence.url,
              kind: "portfolio" as const,
              excerpt: evidence.excerpt,
              ...(evidence.updatedAt ? { updatedAt: evidence.updatedAt } : {}),
            }));
          grounded = citations.length > 0;
        } else if (intent === "role-fit") {
          answer =
            "Paste the job description in Recruiter mode so I can compare its explicit requirements with published evidence and show genuine gaps. I won’t produce a fictional compatibility score.";
        } else if (intent === "interview" && !input.jobDescription) {
          answer =
            "Add the job description in Recruiter mode first. I’ll use it to run a role-grounded interview instead of asking generic questions.";
        } else {
          if (intent === "interview" && input.jobDescription) {
            queryPlan.expandedQuery = [
              queryPlan.expandedQuery,
              input.jobDescription.slice(0, 1_000),
            ].join(" ");
          }
          const sources = await retrieveAevaContext(
            queryPlan,
            contract.retrievalLimit,
          );
          send({
            type: "status",
            message: input.allowWeb
              ? "Grounding the answer"
              : "Preparing the answer",
          });
          const provider = await generateProviderAnswer({
            question: resolvedQuestion,
            mode: input.mode,
            intent,
            allowWeb: input.allowWeb,
            sources,
            history: input.history,
            pageContext,
            jobDescription: input.jobDescription,
            contract,
            queryPlan,
          });
          if (provider) {
            answer = provider.answer;
            citations = provider.citations;
            grounded = citations.length > 0;
            usedWeb = provider.usedWeb;
          } else if (sources.length) {
            answer = groundedFallbackAnswer({
              sources,
              plan: queryPlan,
              maxWords: contract.maxWords,
            });
            citations = deduplicateAevaCitations(
              sources.map(citationFromCandidate),
            ).slice(0, contract.maxCitations);
            usedVerifiedSourceFallback = true;
            grounded = false;
            usedWeb = sources.some((source) => source.kind === "web");
          } else {
            answer =
              "I don't have enough published evidence to answer that responsibly. I won't guess. You can let me search the live web, ask about Ace's published work, or share this question anonymously so he knows what visitors want to learn.";
            await recordKnowledgeGap(
              input.question,
              input.shareUnknownQuestion,
              input.policyVersion,
            );
          }
        }

        citations = deduplicateAevaCitations(citations).slice(
          0,
          contract.maxCitations,
        );

        const conversationId = input.shareConversation
          ? await saveSharedExchange({
              conversationId: input.conversationId,
              mode: input.mode,
              question: input.question,
              answer,
              citations,
              consentVersion: input.policyVersion,
            })
          : undefined;
        const result: AevaAnswer = {
          ok: true,
          answer,
          citations,
          followUps: directResponse
            ? []
            : followUps(intent, input.mode, grounded),
          actions: blockedRequest
            ? []
            : createAevaActions({
                question: input.question,
                intent,
                citations,
                pageContext,
              }),
          intent,
          evidenceState: usedWeb
            ? "live-grounded"
            : grounded
              ? "grounded"
              : usedVerifiedSourceFallback
                ? "verified-sources"
                : intent === "conversation"
                  ? "conversational"
                  : directResponse
                    ? "conversational"
                    : "insufficient",
          ...(conversationId ? { conversationId } : {}),
          grounded,
          usedWeb,
          storage: input.shareConversation
            ? conversationId
              ? "shared"
              : "not-saved"
            : "browser",
          requestId,
        };
        send({ type: "answer", result });
        await recordAnalyticsMetric({ kind: "aeva_request" });
      } catch (error) {
        await recordAnalyticsMetric({ kind: "aeva_request", failed: true });
        logger.error({
          event: "aeva_request_failed",
          requestId,
          ...safeErrorFields(error),
        });
        send({
          type: "answer",
          result: {
            ok: false,
            answer: "I can’t answer that right now. Please try again shortly.",
            citations: [],
            followUps: [],
            actions: [],
            intent: "general-knowledge",
            evidenceState: "insufficient",
            grounded: false,
            usedWeb: false,
            storage: "not-saved",
            requestId,
          } satisfies AevaAnswer,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
