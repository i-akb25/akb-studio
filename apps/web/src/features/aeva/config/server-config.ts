import "server-only";

function enabled(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function boundedInteger(
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(process.env[name] ?? fallback);
  return Number.isFinite(parsed)
    ? Math.max(min, Math.min(max, Math.floor(parsed)))
    : fallback;
}

export const aevaServerConfig = {
  publicEnabled: enabled("AEVA_PUBLIC_ENABLED"),
  privateEnabled: enabled("AEVA_PRIVATE_ENABLED"),
  documentIngestionEnabled: enabled("AEVA_DOCUMENT_INGESTION_ENABLED"),
  actionsEnabled: enabled("AEVA_ACTIONS_ENABLED"),
  externalActionsEnabled: enabled("AEVA_EXTERNAL_ACTIONS_ENABLED"),
  monitorEnabled: enabled("AEVA_MONITOR_ENABLED"),
  socialEnabled: enabled("AEVA_SOCIAL_ENABLED"),
  emailEnabled: enabled("AEVA_EMAIL_ENABLED"),
  voiceEnabled: enabled("AEVA_VOICE_ENABLED"),
  maxRetrievalChunks: boundedInteger("AEVA_MAX_RETRIEVAL_CHUNKS", 4, 1, 5),
  maxConversationTurns: boundedInteger("AEVA_MAX_CONVERSATION_TURNS", 8, 2, 12),
  requestTimeoutMs: boundedInteger(
    "AEVA_REQUEST_TIMEOUT_MS",
    15_000,
    3_000,
    30_000,
  ),
} as const;
