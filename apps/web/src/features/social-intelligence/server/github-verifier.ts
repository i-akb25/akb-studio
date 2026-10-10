import "server-only";

import { recordOperationalHealth } from "@/server/analytics/metrics";
import type { SocialProbe, SocialVerificationResult } from "../model";

const GITHUB_API_ORIGIN = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
const TIMEOUT_MS = 8_000;

function requestHeaders(token?: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "User-Agent": "akb-studio-social-intelligence",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

function knowledgeReadToken(): string | undefined {
  return (
    process.env.AKB_KNOWLEDGE_GITHUB_TOKEN?.trim() ||
    process.env.GITHUB_READ_TOKEN?.trim() ||
    undefined
  );
}

function mirrorWriteToken(): string | undefined {
  return (
    process.env.AKB_KNOWLEDGE_GITHUB_WRITE_TOKEN?.trim() ||
    process.env.GITHUB_CONTENT_TOKEN?.trim() ||
    undefined
  );
}

async function probe(input: {
  id: SocialProbe["id"];
  label: string;
  endpoint: string;
  token?: string;
  disabledDetail?: string;
  successDetail: string;
  healthKey: string;
}): Promise<SocialProbe> {
  if (input.disabledDetail) {
    await recordOperationalHealth({
      key: input.healthKey,
      status: "disabled",
      summary: input.disabledDetail,
    });
    return {
      id: input.id,
      label: input.label,
      status: "disabled",
      detail: input.disabledDetail,
    };
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(input.endpoint, {
      headers: requestHeaders(input.token),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const latencyMs = Date.now() - startedAt;
    const healthy = response.ok;
    const detail = healthy
      ? input.successDetail
      : response.status === 401 || response.status === 403
        ? "GitHub denied the configured credential or its repository permission."
        : response.status === 404
          ? "The configured GitHub account, repository or branch was not found."
          : `GitHub returned status ${response.status}.`;
    await recordOperationalHealth({
      key: input.healthKey,
      status: healthy ? "healthy" : "degraded",
      summary: detail,
      latencyMs,
    });
    return {
      id: input.id,
      label: input.label,
      status: healthy ? "healthy" : "degraded",
      detail,
      latencyMs,
    };
  } catch {
    const latencyMs = Date.now() - startedAt;
    const detail = "GitHub did not respond before the bounded timeout.";
    await recordOperationalHealth({
      key: input.healthKey,
      status: "degraded",
      summary: detail,
      latencyMs,
    });
    return {
      id: input.id,
      label: input.label,
      status: "degraded",
      detail,
      latencyMs,
    };
  }
}

export async function verifyGitHubSocialAccess(): Promise<SocialVerificationResult> {
  if (process.env.AEVA_SOCIAL_ENABLED?.trim() !== "true") {
    const detail =
      "AEVA_SOCIAL_ENABLED is not true; provider access stays disabled.";
    const probes: SocialProbe[] = [
      {
        id: "public-discovery",
        label: "Public repository discovery",
        status: "disabled",
        detail,
      },
      {
        id: "knowledge-repository",
        label: "Knowledge repository mirror",
        status: "disabled",
        detail,
      },
      {
        id: "mirror-credential",
        label: "Mirror credential reachability",
        status: "disabled",
        detail,
      },
    ];
    await Promise.all(
      [
        "social_github_discovery",
        "social_github_repository",
        "social_github_mirror_credential",
      ].map((key) =>
        recordOperationalHealth({ key, status: "disabled", summary: detail }),
      ),
    );
    return { checkedAt: new Date().toISOString(), probes };
  }

  const username = process.env.AKB_GITHUB_USERNAME?.trim() || "i-akb25";
  const owner = process.env.AKB_KNOWLEDGE_GITHUB_OWNER?.trim() || "i-akb25";
  const repository =
    process.env.AKB_KNOWLEDGE_GITHUB_REPO?.trim() || "akb-knowledge-content";
  const readToken = knowledgeReadToken();
  const writeToken = mirrorWriteToken();
  const repositoryEndpoint = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
  const [discovery, knowledge, mirror] = await Promise.all([
    probe({
      id: "public-discovery",
      label: "Public repository discovery",
      endpoint: `${GITHUB_API_ORIGIN}/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&direction=desc&per_page=1`,
      token: process.env.GITHUB_READ_TOKEN?.trim() || undefined,
      successDetail:
        "Official GitHub public repository discovery responded successfully.",
      healthKey: "social_github_discovery",
    }),
    probe({
      id: "knowledge-repository",
      label: "Knowledge repository read access",
      endpoint: repositoryEndpoint,
      token: readToken,
      disabledDetail: readToken
        ? undefined
        : "No knowledge repository read credential is configured; private fallback access was not attempted.",
      successDetail:
        "The configured read credential can access repository metadata.",
      healthKey: "social_github_repository",
    }),
    probe({
      id: "mirror-credential",
      label: "Mirror credential reachability",
      endpoint: repositoryEndpoint,
      token: writeToken,
      disabledDetail: writeToken
        ? undefined
        : "No mirror write credential is configured; reachability was not attempted.",
      successDetail:
        "The mirror credential can access repository metadata. Contents write permission is confirmed only by a successful explicit Pravaah update.",
      healthKey: "social_github_mirror_credential",
    }),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    probes: [discovery, knowledge, mirror],
  };
}
