import type {
  AevaConversationTurn,
  AevaIntent,
  AevaMode,
  AevaPageContext,
} from "./model";

const LIVE_INFORMATION =
  /\b(?:weather|temperature|forecast|time|timezone|exchange rate|currency|usd|dollar|prime minister|president|chief minister|\bcm\b|ceo|current price|latest|today|right now)\b/i;
const ROLE_FIT =
  /\b(?:job description|role fit|fit for (?:this|the) role|analy[sz]e (?:this )?role|requirements?|qualifications?|hiring|vacancy)\b/i;
const INTERVIEW =
  /\b(?:mock interview|interview simulation|interview me|practice interview|interview question)\b/i;
const COMPARE =
  /\b(?:compare|comparison|difference|versus|\bvs\.?\b).{0,80}\b(?:project|projects|adhayan|drone|codevet|akb studio|quadcopter)\b/i;
const ARCHITECTURE =
  /\b(?:architecture(?: walkthrough)?|walk me through|system design|request flow|data flow|how (?:it|the system) works)\b/i;
const EXPLAIN_PAGE =
  /\b(?:explain (?:this|the) page|what am i (?:looking at|reading)|summarize (?:this|the) page|this section)\b/i;
const PORTFOLIO =
  /\b(?:anurag|ace|akb|project|portfolio|experience|skill|work|journal|knowledge|pravaah|resume|electrical|automation|robotics|software|drone|adhayan|codevet)\b/i;
const GREETING =
  /^(?:hi|hello|hey|good (?:morning|afternoon|evening)|namaste)(?:[\s,!.'-]+.*)?$/i;
const VISITOR_INTRODUCTION =
  /^(?:i am|i'm|my name is)\s+[a-z][a-z'-]{1,30}[.!?\s]*$/i;
const VISITOR_HERE = /^(?:hey[, ]+)?[a-z][a-z'-]{1,30}\s+here[.!?\s]*$/i;
const AEVA_CAPABILITY =
  /^(?:what (?:do|can) you do|what you do|how can you help(?: me)?|what can you help(?: me)? with)[.!?\s]*$/i;
const CASUAL =
  /^(?:i(?:'m| am) (?:good|fine|great|okay|ok)|(?:hey[, ]+)?how are you|thanks?|thank you|nice to meet you|who are you)[.!?\s]*$/i;
const SKILL_EVIDENCE =
  /\b(?:where|which project|show|evidence|demonstrate[sd]?)\b.{0,60}\b(?:use[sd]?|skill|experience|react|next\.js|typescript|javascript|python|prisma|postgres(?:ql)?|neon|gemini|pixhawk|arduino|matlab)\b/i;
const TIMELINE =
  /\b(?:timeline|chronolog(?:y|ical)|when (?:did|was)|(?:build|built) in|worked on in|project history|over time|before|after)\b/i;

export function isCurrentActivityQuestion(question: string): boolean {
  return /\b(?:what|where).{0,30}\b(?:anurag|ace|he)\b.{0,40}\b(?:doing|working on|building)\b(?:.{0,20}\b(?:today|now|currently)\b)?/i.test(
    question,
  );
}

export function classifyAevaIntent(input: {
  question: string;
  mode: AevaMode;
  pageContext?: AevaPageContext;
  history?: readonly AevaConversationTurn[];
}): AevaIntent {
  const question = input.question.trim();
  if (
    /^(?:yes|yeah|okay|ok|continue|go on|more|tell me more|explain more)[.!?\s]*$/i.test(
      question,
    )
  ) {
    const previous = [...(input.history ?? [])]
      .reverse()
      .find((turn) => turn.role === "user" && turn.text.trim() !== question);
    if (previous) {
      return classifyAevaIntent({
        question: previous.text,
        mode: input.mode,
        pageContext: input.pageContext,
      });
    }
  }
  if (
    GREETING.test(question) ||
    CASUAL.test(question) ||
    VISITOR_INTRODUCTION.test(question) ||
    VISITOR_HERE.test(question) ||
    AEVA_CAPABILITY.test(question)
  )
    return "conversation";
  if (question.length <= 80 && input.history?.length) {
    const previousQuestion = [...input.history]
      .reverse()
      .find((turn) => turn.role === "user")?.text;
    if (
      previousQuestion &&
      LIVE_INFORMATION.test(previousQuestion) &&
      !LIVE_INFORMATION.test(question)
    ) {
      return "live-information";
    }
  }
  if (isCurrentActivityQuestion(question)) return "portfolio";
  if (INTERVIEW.test(question)) return "interview";
  if (
    ROLE_FIT.test(question) ||
    (input.mode === "recruiter" && question.length > 500)
  )
    return "role-fit";
  if (EXPLAIN_PAGE.test(question) && input.pageContext) return "explain-page";
  if (COMPARE.test(question)) return "compare-projects";
  if (TIMELINE.test(question)) return "timeline";
  if (SKILL_EVIDENCE.test(question)) return "skill-evidence";
  if (ARCHITECTURE.test(question)) return "architecture-walkthrough";
  if (LIVE_INFORMATION.test(question)) return "live-information";
  if (PORTFOLIO.test(question) || input.mode !== "explore") return "portfolio";
  return "general-knowledge";
}

function visitorName(
  turns: readonly AevaConversationTurn[],
): string | undefined {
  for (const turn of [...turns].reverse()) {
    if (turn.role !== "user") continue;
    const match =
      turn.text.match(/\b(?:i am|i'm|my name is)\s+([a-z][a-z'-]{1,30})\b/i) ??
      turn.text.match(/^(?:hey[, ]+)?([a-z][a-z'-]{1,30})\s+here[.!?\s]*$/i);
    if (match?.[1])
      return match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
  }
  return undefined;
}

export function conversationalReply(
  question: string,
  turns: readonly AevaConversationTurn[],
): string | undefined {
  const name = visitorName(turns);
  if (/^i(?:'m| am) (?:good|fine|great|okay|ok)[.!?\s]*$/i.test(question))
    return `Good to hear${name ? `, ${name}` : ""}. What brings you here today?`;
  const nameInQuestion =
    question.match(
      /\b(?:i am|i'm|my name is)\s+([a-z][a-z'-]{1,30})\b/i,
    )?.[1] ??
    question.match(/^(?:hey[, ]+)?([a-z][a-z'-]{1,30})\s+here[.!?\s]*$/i)?.[1];
  if (nameInQuestion) {
    const name =
      nameInQuestion[0].toUpperCase() + nameInQuestion.slice(1).toLowerCase();
    return `Hello ${name}, good to meet you. How are you?`;
  }
  if (/^(?:hey[, ]+)?how are you[.!?\s]*$/i.test(question))
    return `I’m doing well${name ? `, ${name}` : ""}. What would you like to explore in AKB Studio?`;
  if (/^(?:thanks?|thank you)[.!?\s]*$/i.test(question))
    return `You’re welcome${name ? `, ${name}` : ""}.`;
  if (/who are you/i.test(question))
    return "I’m Aeva, AKB Studio’s disclosed AI portfolio assistant. I can help you inspect Anurag’s published work, technical decisions and role evidence.";
  if (AEVA_CAPABILITY.test(question))
    return "I help visitors explore Anurag’s published projects, engineering decisions, skills, writing and role evidence. I can also answer current public-information questions when live web search is enabled.";
  if (GREETING.test(question))
    return `Hello${name ? ` ${name}` : ""}. What would you like to know about Anurag’s work?`;
  return undefined;
}

export function retrievalQuery(
  question: string,
  intent: AevaIntent,
  pageContext?: AevaPageContext,
): string {
  if (!pageContext || intent !== "explain-page") return question;
  return [
    question,
    pageContext.title,
    pageContext.sectionLabel,
    pageContext.path,
  ]
    .filter(Boolean)
    .join(" ");
}
