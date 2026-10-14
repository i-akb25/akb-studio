import type { AevaConversationTurn } from "../model";
import { meaningfulTokens } from "./memory-retrieval";

export const CHAT_STORAGE_KEY = "akb:aeva:active-chat:v1";
export const MAX_SESSION_MESSAGES = 1_000;

export function visitorName(
  turns: readonly AevaConversationTurn[],
): string | undefined {
  for (const turn of [...turns].reverse()) {
    if (turn.role !== "user") continue;
    const match = turn.text
      .trim()
      .match(
        /^(?:(?:hey|hi|hello)[,! ]+)?(?:(?:i am|i'm|my name is|call me)\s+([\p{L}][\p{L}'-]{1,30})|([\p{L}][\p{L}'-]{1,30})\s+here)[.!?\s]*$/iu,
      );
    const name = match?.[1] ?? match?.[2];
    if (
      name &&
      !/^(?:good|fine|great|okay|ok|happy|sad|tired|back|here|an?|the)$/i.test(
        name,
      )
    )
      return name[0].toUpperCase() + name.slice(1).toLowerCase();
  }
  return undefined;
}

/** Keep chronological recent turns plus relevant earlier exchanges from this tab. */
export function selectConversationContext(
  turns: readonly AevaConversationTurn[],
  question: string,
  recentLimit = 12,
): AevaConversationTurn[] {
  const recentStart = Math.max(
    0,
    turns.length - Math.max(2, Math.min(12, recentLimit)),
  );
  const selected = new Set<number>();
  for (let index = recentStart; index < turns.length; index++)
    selected.add(index);
  const query = meaningfulTokens(question);
  const older = turns
    .slice(0, recentStart)
    .map((turn, index) => ({
      index,
      score: meaningfulTokens(turn.text).filter((word) => query.includes(word))
        .length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.index - a.index);
  // Preserve the introduction and initial topic even after a long conversation.
  for (const index of [
    0,
    1,
    ...turns
      .map((turn, index) =>
        turn.role === "user" && visitorName([turn]) ? index : -1,
      )
      .filter((index) => index >= 0)
      .slice(-1),
  ]) {
    if (index < turns.length) selected.add(index);
  }
  for (const item of older) {
    if (selected.size >= 22) break;
    selected.add(item.index);
    if (item.index + 1 < turns.length) selected.add(item.index + 1);
  }
  return [...selected]
    .sort((a, b) => a - b)
    .map((index) => ({
      role: turns[index].role,
      text: turns[index].text.slice(0, 1_000),
    }));
}

export function conversationClosing(
  turns: readonly AevaConversationTurn[],
): string {
  const name = visitorName(turns);
  return `Thanks for chatting with me${name ? `, ${name}` : ""}! Feel free to come back whenever you’d like to explore more.`;
}

/** Extractive notes, not newly inferred facts. Full turns stay in this tab. */
export function earlierConversationSummary(
  turns: readonly AevaConversationTurn[],
): string {
  const older = turns.slice(0, -12).filter((turn) => turn.role === "user");
  if (!older.length) return "";
  const name = visitorName(turns);
  const topics = [
    ...new Set(older.map((turn) => turn.text.replace(/\s+/g, " ").trim())),
  ];
  const selected = [...new Set([...topics.slice(0, 2), ...topics.slice(-8)])];
  return [
    name
      ? `Visitor introduced themselves as ${name}. This is not identity verification.`
      : "",
    ...selected.map((text) => `Earlier visitor message: ${text.slice(0, 320)}`),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 4_000);
}

export function conversationRecall(
  question: string,
  turns: readonly AevaConversationTurn[],
): string | undefined {
  if (
    /\b(?:what(?:'s| is) my name|remember my name|who am i)\b/i.test(question)
  ) {
    const name = visitorName(turns);
    return name
      ? `You introduced yourself as ${name}.`
      : "You haven’t told me your name in this conversation.";
  }
  if (
    /\b(?:what did i (?:first ask|ask first)|my first question)\b/i.test(
      question,
    )
  ) {
    const first = turns.find((turn) => turn.role === "user");
    return first
      ? `Your first message was: “${first.text}”`
      : "This is your first message in this conversation.";
  }
  return undefined;
}
