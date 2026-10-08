import type { AevaConversationTurn, AevaIntent, AevaMode } from "../model";

const VAGUE_FOLLOW_UP =
  /^(?:yes|yeah|okay|ok|continue|go on|more|tell me more|explain more)[.!?\s]*$/i;

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
  if (!VAGUE_FOLLOW_UP.test(question.trim())) return question;
  const previousQuestion = [...history]
    .reverse()
    .find((turn) => turn.role === "user" && !VAGUE_FOLLOW_UP.test(turn.text));
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
  if (intent === "role-fit" || intent === "compare-projects") {
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
