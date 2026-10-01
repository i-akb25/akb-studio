export type RecruiterEvidence = {
  id: string;
  title: string;
  url: string;
  text: string;
  updatedAt?: string;
};

export type RequirementEvidence = {
  requirement: string;
  evidence: Array<{
    id: string;
    title: string;
    url: string;
    excerpt: string;
    updatedAt?: string;
  }>;
};

export type RoleFitAnalysis = {
  roleTitle: string;
  summary: string;
  evidenceCoverage: { evidenced: number; assessed: number };
  strengths: RequirementEvidence[];
  gaps: string[];
  relevantEvidence: RequirementEvidence["evidence"];
  interviewQuestions: string[];
  generatedAt: string;
};

const REQUIREMENTS = [
  ["Node.js", ["node.js", "nodejs", "node js", "express"]],
  ["TypeScript", ["typescript"]],
  ["JavaScript", ["javascript"]],
  ["React", ["react", "react.js", "reactjs"]],
  ["Next.js", ["next.js", "nextjs", "next js"]],
  ["Angular", ["angular"]],
  ["REST APIs", ["rest api", "restful", "api development", "route handlers"]],
  ["PostgreSQL", ["postgresql", "postgres", "neon"]],
  ["MongoDB", ["mongodb", "mongo"]],
  [
    "CI/CD",
    [
      "ci/cd",
      "continuous integration",
      "continuous delivery",
      "github actions",
    ],
  ],
  ["Docker", ["docker", "containerization", "containers"]],
  ["Distributed systems", ["distributed systems", "microservices"]],
  ["System design", ["system design", "software architecture", "architecture"]],
  [
    "Testing",
    ["testing", "unit tests", "integration tests", "test automation"],
  ],
  ["Security", ["security", "owasp", "authentication", "authorization"]],
  ["Electrical engineering", ["electrical engineering", "electrical systems"]],
  ["Industrial automation", ["industrial automation", "automation", "plc"]],
  ["Control engineering", ["control engineering", "pid", "control systems"]],
  [
    "Embedded systems",
    ["embedded systems", "arduino", "raspberry pi", "pixhawk"],
  ],
  ["Robotics", ["robotics", "robot", "quadcopter", "drone"]],
  [
    "AI systems",
    ["artificial intelligence", "machine learning", "rag", "llm", "ai systems"],
  ],
] as const;

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-IN")
    .replace(/[^a-z0-9+#./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(text: string, aliases: readonly string[]): string {
  const compact = text.replace(/\s+/g, " ").trim();
  const lower = compact.toLocaleLowerCase("en-IN");
  const index = aliases
    .map((alias) => lower.indexOf(alias.toLocaleLowerCase("en-IN")))
    .filter((position) => position >= 0)
    .sort((left, right) => left - right)[0];
  if (index === undefined) return compact.slice(0, 220);
  return compact.slice(Math.max(0, index - 70), index + 150).trim();
}

function roleTitle(jobDescription: string): string {
  return (
    jobDescription
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length >= 3 && line.length <= 90) ?? "Supplied role"
  );
}

export function analyzeRoleFit(
  jobDescription: string,
  evidence: readonly RecruiterEvidence[],
  now = new Date(),
): RoleFitAnalysis {
  const normalizedJob = normalize(jobDescription);
  const requested = REQUIREMENTS.filter(([, aliases]) =>
    aliases.some((alias) => normalizedJob.includes(normalize(alias))),
  );
  const strengths: RequirementEvidence[] = [];
  const gaps: string[] = [];

  for (const [requirement, aliases] of requested) {
    const matches = evidence
      .filter((item) => {
        const haystack = normalize(`${item.title} ${item.text}`);
        return aliases.some((alias) => haystack.includes(normalize(alias)));
      })
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        excerpt: excerpt(item.text, aliases),
        ...(item.updatedAt ? { updatedAt: item.updatedAt } : {}),
      }));
    if (matches.length) strengths.push({ requirement, evidence: matches });
    else gaps.push(requirement);
  }

  const relevantEvidence = [
    ...new Map(
      strengths
        .flatMap((strength) => strength.evidence)
        .map((item) => [item.id, item]),
    ).values(),
  ].slice(0, 6);
  const assessed = requested.length;
  const summary = assessed
    ? `${strengths.length} of ${assessed} explicitly detected requirements have published supporting evidence. This is evidence coverage, not a hiring recommendation.`
    : "The description did not contain enough explicit technical requirements for a reliable comparison. Add the responsibilities and required stack.";
  const interviewQuestions = strengths
    .slice(0, 3)
    .map(
      (strength) =>
        `Ask Anurag to explain the decisions and trade-offs behind his ${strength.requirement} evidence in ${strength.evidence[0]?.title}.`,
    );
  if (gaps.length) {
    interviewQuestions.push(
      `Ask for direct evidence or a practical example covering ${gaps.slice(0, 3).join(", ")}.`,
    );
  }

  return {
    roleTitle: roleTitle(jobDescription),
    summary,
    evidenceCoverage: { evidenced: strengths.length, assessed },
    strengths,
    gaps,
    relevantEvidence,
    interviewQuestions: interviewQuestions.slice(0, 4),
    generatedAt: now.toISOString(),
  };
}
