import type { AevaQueryPlan } from "../model";
import { clampWords } from "./response-contract";

export type GroundedExcerpt = {
  title: string;
  content: string;
  excerpt?: string;
  updatedAt?: string;
};

function evidenceLine(source: GroundedExcerpt): string {
  return `${source.title}: ${source.excerpt ?? source.content.slice(0, 220)}`;
}

function temporalValue(source: GroundedExcerpt): number {
  const explicitYear = `${source.title} ${source.content}`.match(
    /\b(20\d{2})\b/,
  );
  if (explicitYear?.[1]) return Number(explicitYear[1]);
  const updated = source.updatedAt
    ? new Date(source.updatedAt).getUTCFullYear()
    : Number.NaN;
  return Number.isFinite(updated) ? updated : Number.POSITIVE_INFINITY;
}

export function groundedFallbackAnswer(input: {
  sources: readonly GroundedExcerpt[];
  plan: AevaQueryPlan;
  maxWords: number;
}): string {
  const selected = input.sources.slice(0, 3);
  let heading = "Here is the strongest relevant published evidence:";
  let sources = selected;

  if (input.plan.responseShape === "comparison") {
    heading =
      "Published comparison evidence (the sources do not support assumptions beyond these facts):";
  } else if (input.plan.responseShape === "timeline") {
    heading =
      "Published timeline evidence (undated items are not assigned an invented date):";
    sources = [...selected].sort(
      (left, right) => temporalValue(left) - temporalValue(right),
    );
  } else if (input.plan.responseShape === "evidence-list") {
    heading = "Direct published evidence for the requested skill:";
  } else if (input.plan.responseShape === "technical") {
    heading = "Published technical evidence:";
  }

  return clampWords(
    `${heading}\n\n${sources.map((source) => `• ${evidenceLine(source)}`).join("\n\n")}`,
    input.maxWords,
  );
}
