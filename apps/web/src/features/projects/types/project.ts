export const PROJECT_DISCIPLINES = [
  "software",
  "electrical",
  "robotics",
  "automation",
  "ai",
] as const;

export type ProjectDiscipline = (typeof PROJECT_DISCIPLINES)[number];

export type ProjectTier = "flagship" | "standard" | "compact" | "experiment";

export type ProjectLifecycle =
  | "active"
  | "completed"
  | "in-progress"
  | "under-review"
  | "archived";

export type ProjectPublication = "published" | "draft" | "archived";

export type ProjectCaseStudyState =
  | "published"
  | "planned"
  | "under-review"
  | "unavailable";

export type TechnologyIcon =
  | "code"
  | "server"
  | "database"
  | "ai"
  | "hardware"
  | "network"
  | "tool";

export type ProjectTechnology = {
  name: string;
  icon: TechnologyIcon;
};

export type AvailableProjectLink = {
  kind: "repository" | "demo" | "package" | "documentation";
  label: string;
  state: "available";
  href: string;
};

export type UnavailableProjectLink = {
  kind: "repository" | "demo" | "package" | "documentation";
  label: string;
  state:
    | "planned"
    | "planned-public"
    | "private"
    | "under-review"
    | "unavailable";
  href?: never;
};

export type ProjectLink = AvailableProjectLink | UnavailableProjectLink;

export type ProjectImage = {
  kind: "image";
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type ProjectVideo = {
  kind: "video";
  src: string;
  label: string;
  poster?: string;
  caption?: string;
  captions?: string;
};

export type ProjectMedia = ProjectImage | ProjectVideo;

export type ProjectRecord = {
  order: number;
  slug: string;
  title: string;
  shortTitle?: string;
  categoryLabel: string;
  summary: string;
  disciplines: readonly ProjectDiscipline[];
  tier: ProjectTier;
  lifecycle: ProjectLifecycle;
  publication: ProjectPublication;
  caseStudyState: ProjectCaseStudyState;
  period?: string;
  role?: string;
  homepageOrder?: number;
  cover?: ProjectImage;
  technologies: readonly ProjectTechnology[];
  links: readonly ProjectLink[];
};

export type ProjectFact = {
  label: string;
  value: string;
};

export type ProjectDecision = {
  title: string;
  context: string;
  decision: string;
  tradeoff?: string;
};

export type ProjectImplementationSection = {
  id: string;
  title: string;
  body: readonly string[];
  points?: readonly string[];
  media?: readonly ProjectMedia[];
};

export type ProjectEvidence = {
  kind: "artifact" | "demonstration" | "measurement" | "test";
  title: string;
  description: string;
  source?: string;
};

export type ProjectOutcome = {
  title: string;
  description: string;
  evidence?: string;
};

export type ProjectCaseStudy = {
  projectSlug: string;
  introduction: string;
  facts: readonly ProjectFact[];
  problem: readonly string[];
  constraints: readonly string[];
  responsibilities: readonly string[];
  decisions: readonly ProjectDecision[];
  implementation: readonly ProjectImplementationSection[];
  evidence: readonly ProjectEvidence[];
  outcomes: readonly ProjectOutcome[];
  lessons: readonly string[];
  gallery: readonly ProjectMedia[];
};
