import { z } from "zod";
import type { AevaCitation, AevaConversationTurn } from "../model";

export function providerThinkingConfig(model: string) {
  return /^gemini-3(?:[.-]|$)/i.test(model)
    ? { thinkingConfig: { thinkingLevel: "LOW", includeThoughts: false } }
    : {};
}

const answerSchema = z
  .object({
    answer: z.string().trim().min(1).max(12_000),
    sourceIds: z.array(z.string().min(1).max(300)).max(20),
  })
  .strict();

export function parseProviderAnswer(
  raw: string,
  allowedIds: readonly string[],
) {
  try {
    const parsed = answerSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const allowed = new Set(allowedIds);
    if (parsed.data.sourceIds.some((id) => !allowed.has(id))) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function boundedConversationHistory(
  turns: readonly AevaConversationTurn[],
  limit = 8,
): AevaConversationTurn[] {
  return turns
    .slice(-limit)
    .map(({ role, text }) => ({ role, text: text.slice(0, 1_000).trim() }))
    .filter((turn) => turn.text.length > 0);
}

export function safeWebCitationUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !url.hostname.includes(".") ||
      /^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(
        url.hostname,
      ) ||
      /\.(?:local|internal|localhost)$/i.test(url.hostname)
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export type GoogleGroundingMetadata = {
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  groundingSupports?: Array<{ groundingChunkIndices?: number[] }>;
};

// A search result is not evidence until the provider associates it with output.
export function groundedWebCitations(
  metadata: GoogleGroundingMetadata | undefined,
  enabled: boolean,
): AevaCitation[] {
  if (!enabled) return [];
  const supported = new Set(
    metadata?.groundingSupports?.flatMap(
      (support) => support.groundingChunkIndices ?? [],
    ) ?? [],
  );
  const seen = new Set<string>();
  return (metadata?.groundingChunks ?? []).flatMap((chunk, index) => {
    if (!supported.has(index) || !chunk.web?.uri) return [];
    const url = safeWebCitationUrl(chunk.web.uri);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [
      {
        id: `grounded-web-${index}`,
        title: chunk.web.title?.trim().slice(0, 240) || new URL(url).hostname,
        url,
        kind: "web" as const,
        updatedAt: new Date().toISOString(),
      },
    ];
  });
}
