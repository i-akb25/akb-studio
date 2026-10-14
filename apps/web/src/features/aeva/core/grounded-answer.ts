import type { AevaQueryPlan } from "../model";
import { safeAevaAnswer } from "../security/output-guard";
import { meaningfulTokens } from "./memory-retrieval";
export type GroundedExcerpt = {
  title: string;
  content: string;
  excerpt?: string;
  updatedAt?: string;
};

export function approvedShortReply(
  source: GroundedExcerpt,
  maxWords: number,
  question?: string,
): string | null {
  const text = source.content.trim();
  if (
    !source.title.trim().endsWith("?") ||
    text.split(/\s+/).length > Math.min(maxWords, 65)
  )
    return null;
  if (
    /\b(?:Question|Sample reply|Answer)\s*:|\n\s*[•*-]|https?:\/\//i.test(text)
  )
    return null;
  if (!/[.!?🙂😊😉]$/u.test(text)) return null;
  if (question) {
    const terms = meaningfulTokens(question);
    const heading = meaningfulTokens(source.title);
    if (!terms.length || !terms.every((term) => heading.includes(term)))
      return null;
  }
  return safeAevaAnswer(text, maxWords);
}

export function groundedFallbackAnswer(input: {
  sources: readonly GroundedExcerpt[];
  plan: AevaQueryPlan;
  maxWords: number;
}): string {
  const source = input.sources[0];
  return (
    (source &&
      approvedShortReply(
        source,
        input.maxWords,
        input.plan.originalQuestion,
      )) ||
    "I found relevant published information, but I can’t turn it into a reliable answer right now. Please try again shortly. You can also check the sources below."
  );
}
