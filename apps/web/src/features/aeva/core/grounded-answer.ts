import type { AevaQueryPlan } from "../model";
import { clampWords } from "./response-contract";
export type GroundedExcerpt = {
  title: string;
  content: string;
  excerpt?: string;
  updatedAt?: string;
};

function conciseExcerpt(value: string, maxWords = 34): string {
  const cleaned = value
    .replace(/Related evidence:[\s\S]*$/i, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Published evidence is available on the linked page.";
  const sentence = cleaned.split(/(?<=[.!?])\s+/, 1)[0] ?? cleaned;
  return clampWords(sentence, maxWords);
}

export function groundedFallbackAnswer(input: {
  sources: readonly GroundedExcerpt[];
  plan: AevaQueryPlan;
  maxWords: number;
}): string {
  const evidence = input.sources
    .filter((source) => source.title.trim() && source.content.trim())
    .filter(
      (source, index, sources) =>
        sources.findIndex((item) => item.title === source.title) === index,
    )
    .slice(0, input.plan.responseShape === "comparison" ? 2 : 3)
    .map(
      (source) => `• ${source.title.trim()}: ${conciseExcerpt(source.content)}`,
    );

  const introduction =
    input.plan.responseShape === "comparison"
      ? "Here is the comparison supported by the published portfolio:"
      : input.plan.responseShape === "timeline"
        ? "Here is the published evidence relevant to that timeline:"
        : input.plan.responseShape === "technical"
          ? "Here is the strongest published technical evidence:"
          : "Here is what the published portfolio supports:";

  return clampWords(
    evidence.length
      ? `${introduction}\n\n${evidence.join("\n")}`
      : "I don’t have enough reliable published evidence to answer that without guessing. Try a more specific portfolio question or enable live web search for current public information.",
    input.maxWords,
  );
}
