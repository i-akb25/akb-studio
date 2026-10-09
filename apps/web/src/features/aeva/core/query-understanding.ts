import type {
  AevaIntent,
  AevaMode,
  AevaQueryPlan,
  AevaResponseShape,
} from "../model";

const ENTITY_ALIASES: ReadonlyArray<readonly [RegExp, readonly string[]]> = [
  [/\b(?:ace|anurag|akb)\b/i, ["Anurag Kumar Bharti", "AKB Studio"]],
  [/\badhayan\b/i, ["ADHAYAN", "education", "learning platform"]],
  [/\bcode\s?vet\b/i, ["CodeVet", "code review", "software"]],
  [
    /\b(?:drone|quadcopter|uav)\b/i,
    ["Automated Drone Delivery", "drone", "quadcopter"],
  ],
  [/\bakb studio\b/i, ["AKB Studio", "portfolio"]],
];

const TECHNOLOGIES = [
  "React",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "Prisma",
  "PostgreSQL",
  "Neon",
  "Gemini",
  "Pixhawk",
  "Arduino",
  "MATLAB",
] as const;

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function responseShape(intent: AevaIntent, mode: AevaMode): AevaResponseShape {
  if (intent === "compare-projects") return "comparison";
  if (intent === "timeline") return "timeline";
  if (intent === "skill-evidence") return "evidence-list";
  if (intent === "role-fit" || intent === "interview" || mode === "recruiter")
    return "recruiter";
  if (intent === "architecture-walkthrough" || mode === "technical")
    return "technical";
  return "brief";
}

export function understandAevaQuery(input: {
  question: string;
  intent: AevaIntent;
  mode: AevaMode;
}): AevaQueryPlan {
  const entities = unique(
    ENTITY_ALIASES.flatMap(([pattern, aliases]) =>
      pattern.test(input.question) ? aliases : [],
    ),
  );
  const technologies = TECHNOLOGIES.filter((technology) =>
    new RegExp(
      `\\b${technology.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i",
    ).test(input.question),
  );
  const years = unique(
    [...input.question.matchAll(/\b(20\d{2})\b/g)].map((match) => match[1]),
  ).map(Number);
  const expansion = unique([
    ...entities,
    ...technologies,
    ...years.map(String),
  ]);

  return {
    originalQuestion: input.question,
    expandedQuery: [input.question, ...expansion].join(" "),
    intent: input.intent,
    responseShape: responseShape(input.intent, input.mode),
    entities,
    technologies: [...technologies],
    years,
  };
}
