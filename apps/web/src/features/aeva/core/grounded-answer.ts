import type { AevaQueryPlan } from "../model";
import { clampWords } from "./response-contract";
export type GroundedExcerpt = {
  title: string;
  content: string;
  excerpt?: string;
  updatedAt?: string;
};

export function groundedFallbackAnswer(input: {
  sources: readonly GroundedExcerpt[];
  plan: AevaQueryPlan;
  maxWords: number;
}): string {
  const titles = [
    ...new Set(input.sources.map((source) => source.title.trim())),
  ]
    .filter(Boolean)
    .slice(0, 3);
  const pages = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(titles);
  return clampWords(
    pages
      ? `I couldn’t prepare a reliable conversational answer. You can open the verified pages for ${pages} below, or try again shortly.`
      : "I don’t have enough reliable published evidence to answer that without guessing. Try a more specific portfolio question or enable live web search for current public information.",
    input.maxWords,
  );
}
