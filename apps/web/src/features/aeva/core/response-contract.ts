import type { AevaConversationTurn, AevaIntent, AevaMode } from "../model";

const VAGUE_FOLLOW_UP =
  /^(?:yes|yeah|okay|ok|continue|go on|more|tell me more|explain more)[.!?\s]*$/i;
const QUESTION_LIKE =
  /\b(?:what|when|where|which|who|why|how|can|could|do|does|did|is|are|was|were|will|would|should|rain|snow|hot|cold)\b/i;

function looksLikeLocation(value: string): boolean {
  const normalized = value.trim();
  return (
    normalized.length <= 60 &&
    normalized.split(/\s+/).length <= 5 &&
    /^[\p{L}\p{M} .,'-]+$/u.test(normalized) &&
    !QUESTION_LIKE.test(normalized)
  );
}

export type AevaResponseContract = {
  maxWords: number;
  maxCitations: number;
  retrievalLimit: number;
  requiresEvidence: boolean;
};

export function resolveFollowUpQuestion(
  question: string,
  history: readonly AevaConversationTurn[],
): string {
  const previousQuestion = [...history]
    .reverse()
    .find((turn) => turn.role === "user" && !VAGUE_FOLLOW_UP.test(turn.text));
  if (
    previousQuestion &&
    looksLikeLocation(question) &&
    /\b(?:weather|temperature|forecast|time|timezone)\b/i.test(
      previousQuestion.text,
    ) &&
    !/\b(?:weather|temperature|forecast|time|timezone)\b/i.test(question)
  ) {
    return `${previousQuestion.text} Location clarification: ${question.trim()}`;
  }
  if (!VAGUE_FOLLOW_UP.test(question.trim())) return question;
  return previousQuestion
    ? `${question.trim()}: expand only the previous subject: ${previousQuestion.text}`
    : question;
}

export function createResponseContract(
  intent: AevaIntent,
  mode: AevaMode,
): AevaResponseContract {
  if (intent === "conversation") {
    return {
      maxWords: 70,
      maxCitations: 0,
      retrievalLimit: 0,
      requiresEvidence: false,
    };
  }
  if (
    intent === "role-fit" ||
    intent === "compare-projects" ||
    intent === "skill-evidence" ||
    intent === "timeline"
  ) {
    return {
      maxWords: 180,
      maxCitations: 3,
      retrievalLimit: 5,
      requiresEvidence: true,
    };
  }
  if (mode === "technical" || intent === "architecture-walkthrough") {
    return {
      maxWords: 160,
      maxCitations: 3,
      retrievalLimit: 4,
      requiresEvidence: true,
    };
  }
  return {
    maxWords: 110,
    maxCitations: 3,
    retrievalLimit: 4,
    requiresEvidence: true,
  };
}

export function clampWords(value: string, maxWords: number): string {
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();
  return `${words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,:;]$/, "")}…`;
}
