export const SOCIAL_PROVIDER_IDS = [
  "github",
  "linkedin",
  "x",
  "instagram",
] as const;

export type SocialProviderId = (typeof SOCIAL_PROVIDER_IDS)[number];
export type SocialAccessMode = "official-api" | "manual-review";
export type SocialProviderState = "ready" | "limited" | "manual" | "disabled";

export type SocialCredentialState = {
  name: string;
  configured: boolean;
  purpose: string;
  legacy?: boolean;
};

export type SocialProviderManifest = {
  id: SocialProviderId;
  label: string;
  mode: SocialAccessMode;
  state: SocialProviderState;
  summary: string;
  permissions: readonly string[];
  safeguards: readonly string[];
  credentials: readonly SocialCredentialState[];
  automaticIngestion: boolean;
  automaticPublishing: boolean;
  feedsAeva: boolean;
};

export type SocialIntelligenceSnapshot = {
  enabled: boolean;
  generatedAt: string;
  providers: readonly SocialProviderManifest[];
};

export type SocialProbe = {
  id: "public-discovery" | "knowledge-repository" | "mirror-credential";
  label: string;
  status: "healthy" | "degraded" | "disabled";
  detail: string;
  latencyMs?: number;
};

export type SocialVerificationResult = {
  checkedAt: string;
  probes: readonly SocialProbe[];
};
