import "server-only";

import type {
  SocialCredentialState,
  SocialIntelligenceSnapshot,
  SocialProviderManifest,
} from "../model";

type Environment = NodeJS.ProcessEnv;

function configured(environment: Environment, name: string): boolean {
  return Boolean(environment[name]?.trim());
}

function credential(
  environment: Environment,
  name: string,
  purpose: string,
  legacy = false,
): SocialCredentialState {
  return {
    name,
    configured: configured(environment, name),
    purpose,
    ...(legacy ? { legacy: true } : {}),
  };
}

export function socialIntelligenceSnapshot(
  environment: Environment = process.env,
  now = new Date(),
): SocialIntelligenceSnapshot {
  const enabled = environment.AEVA_SOCIAL_ENABLED?.trim() === "true";
  const githubRead = configured(environment, "GITHUB_READ_TOKEN");
  const knowledgeRead = configured(environment, "AKB_KNOWLEDGE_GITHUB_TOKEN");
  const knowledgeWrite = configured(
    environment,
    "AKB_KNOWLEDGE_GITHUB_WRITE_TOKEN",
  );
  const legacyWrite = configured(environment, "GITHUB_CONTENT_TOKEN");
  const githubReady =
    githubRead || knowledgeRead || knowledgeWrite || legacyWrite;

  const github: SocialProviderManifest = {
    id: "github",
    label: "GitHub",
    mode: "official-api",
    state: enabled ? (githubReady ? "ready" : "limited") : "disabled",
    summary: enabled
      ? githubReady
        ? "Official API access is configured. Run verification before relying on private-repository or mirror access."
        : "Public repository discovery can run anonymously; private repository access and mirror writes are unavailable."
      : "Social intelligence is disabled by the global fail-closed switch.",
    permissions: [
      "Read public repository metadata for reviewed discovery",
      "Read the configured knowledge repository when a read token is present",
      "Write only content/feature-manifest.json when a write token is present",
    ],
    safeguards: [
      "Official api.github.com endpoints only",
      "No token values returned to the browser or written to audit records",
      "Every discovered item requires an explicit Admin feature action",
      "A verification probe never creates, updates or deletes GitHub content",
    ],
    credentials: [
      credential(
        environment,
        "GITHUB_READ_TOKEN",
        "Optional read-only public discovery token",
      ),
      credential(
        environment,
        "AKB_KNOWLEDGE_GITHUB_TOKEN",
        "Private knowledge repository read access",
      ),
      credential(
        environment,
        "AKB_KNOWLEDGE_GITHUB_WRITE_TOKEN",
        "Private knowledge manifest mirror write access",
      ),
      credential(
        environment,
        "GITHUB_CONTENT_TOKEN",
        "Legacy project and Pravaah content token",
        true,
      ),
    ],
    automaticIngestion: false,
    automaticPublishing: false,
    feedsAeva: false,
  };

  const manualProvider = (
    id: "linkedin" | "x" | "instagram",
    label: string,
  ): SocialProviderManifest => ({
    id,
    label,
    mode: "manual-review",
    state: "manual",
    summary:
      "No provider credential is configured. Only an Admin-reviewed canonical link can enter Pravaah; this manual path is independent of Aeva's social switch.",
    permissions: ["Store an Admin-supplied canonical HTTPS link and excerpt"],
    safeguards: [
      "No scraping",
      "No account login or session reuse",
      "No automatic ingestion or publishing",
      "No access to messages, contacts or audience data",
    ],
    credentials: [],
    automaticIngestion: false,
    automaticPublishing: false,
    feedsAeva: false,
  });

  return {
    enabled,
    generatedAt: now.toISOString(),
    providers: [
      github,
      manualProvider("linkedin", "LinkedIn"),
      manualProvider("x", "X"),
      manualProvider("instagram", "Instagram"),
    ],
  };
}
