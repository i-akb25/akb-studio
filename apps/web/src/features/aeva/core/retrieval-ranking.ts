import type { AevaQueryPlan } from "../model";

export type RankingCandidate = {
  title: string;
  content: string;
  score: number;
  updatedAt?: string;
  authority: "canonical" | "supporting" | "contextual";
};

export function rankRetrievalCandidate(
  candidate: RankingCandidate,
  plan?: AevaQueryPlan,
  now = Date.now(),
): number | null {
  // Authority and freshness may reorder relevant evidence, never admit an
  // otherwise unrelated source.
  if (candidate.score < 4) return null;
  const authority = { canonical: 6, supporting: 3, contextual: 0 }[
    candidate.authority
  ];
  const updated = candidate.updatedAt
    ? new Date(candidate.updatedAt).getTime()
    : Number.NaN;
  const ageInDays = (now - updated) / 86_400_000;
  const freshness = Number.isFinite(ageInDays)
    ? ageInDays >= 0 && ageInDays <= 365
      ? 2
      : ageInDays <= 365 * 3
        ? 1
        : 0
    : 0;
  if (!plan) return candidate.score + authority + freshness;

  const title = candidate.title.toLocaleLowerCase("en-IN");
  const content = candidate.content.toLocaleLowerCase("en-IN");
  const entityMatch = plan.entities.some((entity) =>
    title.includes(entity.toLocaleLowerCase("en-IN")),
  );
  const technologyMatches = plan.technologies.filter((technology) =>
    `${title} ${content}`.includes(technology.toLocaleLowerCase("en-IN")),
  ).length;
  const yearMatches = plan.years.filter((year) =>
    content.includes(String(year)),
  ).length;

  return (
    candidate.score +
    authority +
    freshness +
    (entityMatch ? 10 : 0) +
    technologyMatches * 6 +
    yearMatches * 8
  );
}
