import { z } from "zod";
import type { AevaAnswer } from "../model";
import { MAX_SESSION_MESSAGES } from "./conversation-context";
import { safeWebCitationUrl } from "./provider-contract";

export function citationHref(url: string): string | undefined {
  if (
    /^\/(?:$|about|resume|projects(?:\/[a-z0-9-]+)?|journal(?:\/[a-z0-9-]+)?|knowledge(?:\/[a-z0-9-]+){0,2}|pravaah|aeva|contact)(?:#[a-z0-9-]+)?$/i.test(
      url,
    )
  )
    return url;
  return safeWebCitationUrl(url);
}

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().max(8_000),
  citations: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        kind: z.enum(["portfolio", "memory", "owner-url", "web"]),
        updatedAt: z.string().optional(),
        sourceId: z.string().optional(),
      }),
    )
    .max(5)
    .optional(),
  evidenceState: z
    .enum([
      "grounded",
      "live-grounded",
      "verified-sources",
      "conversational",
      "insufficient",
    ])
    .optional(),
  actions: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(["navigate", "filter-projects", "highlight-section"]),
        label: z.string(),
        href: z.string(),
      }),
    )
    .max(3)
    .optional(),
  responseId: z.string().uuid().optional(),
});
export type ChatMessage = z.infer<typeof messageSchema>;
const sessionSchema = z.object({
  version: z.literal(1),
  messages: z.array(messageSchema).max(MAX_SESSION_MESSAGES),
  mode: z.enum(["explore", "technical", "recruiter"]),
  conversationId: z.string().uuid().optional(),
});

export function restoreChatSession(raw: string | null) {
  if (!raw || raw.length > 4_000_000) return null;
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    return {
      ...parsed.data,
      messages: parsed.data.messages.map((message) => ({
        ...message,
        citations: message.citations?.map((citation) => ({
          ...citation,
          url: citationHref(citation.url) ?? "",
        })),
        actions: message.actions?.filter((action) => {
          const path = action.href.split(/[?#]/, 1)[0];
          return action.href.startsWith("/") && Boolean(citationHref(path));
        }),
        evidenceState: message.evidenceState as
          | AevaAnswer["evidenceState"]
          | undefined,
      })),
    };
  } catch {
    return null;
  }
}
