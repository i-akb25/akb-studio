export const AEVA_MODES = ["explore", "technical", "recruiter"] as const;

export type AevaMode = (typeof AEVA_MODES)[number];

export const AEVA_INTENTS = [
  "conversation",
  "portfolio",
  "skill-evidence",
  "timeline",
  "compare-projects",
  "architecture-walkthrough",
  "explain-page",
  "role-fit",
  "interview",
  "live-information",
  "general-knowledge",
] as const;

export type AevaIntent = (typeof AEVA_INTENTS)[number];

export const AEVA_RESPONSE_SHAPES = [
  "brief",
  "evidence-list",
  "comparison",
  "timeline",
  "technical",
  "recruiter",
] as const;

export type AevaResponseShape = (typeof AEVA_RESPONSE_SHAPES)[number];

export type AevaQueryPlan = {
  originalQuestion: string;
  expandedQuery: string;
  intent: AevaIntent;
  responseShape: AevaResponseShape;
  entities: string[];
  technologies: string[];
  years: number[];
};

export type AevaConversationTurn = {
  role: "user" | "assistant";
  text: string;
};

export type AevaPageContext = {
  path: string;
  title?: string;
  sectionId?: string;
  sectionLabel?: string;
};

export type AevaAction = {
  id: string;
  kind: "navigate" | "filter-projects" | "highlight-section";
  label: string;
  href: string;
};

export type AevaCitation = {
  id: string;
  title: string;
  url: string;
  kind: "portfolio" | "memory" | "owner-url" | "web";
  excerpt?: string;
  updatedAt?: string;
  sourceId?: string;
  contentHash?: string;
};

export type AevaAnswer = {
  ok: boolean;
  answer: string;
  citations: AevaCitation[];
  followUps: string[];
  actions: AevaAction[];
  intent: AevaIntent;
  evidenceState:
    | "grounded"
    | "live-grounded"
    | "conversational"
    | "insufficient";
  conversationId?: string;
  grounded: boolean;
  usedWeb: boolean;
  storage: "browser" | "shared" | "not-saved";
  requestId: string;
};
