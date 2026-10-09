import type {
  AevaAction,
  AevaCitation,
  AevaIntent,
  AevaPageContext,
} from "../model";

const SAFE_PUBLIC_PATH =
  /^\/(?:$|projects(?:\/[a-z0-9-]+)?|journal(?:\/[a-z0-9-]+)?|knowledge(?:\/[a-z0-9-]+(?:\/[a-z0-9-]+)?)?|about|contact|pravaah|resume|lab|search|aeva)$/;
const SAFE_SECTION = /^[a-z0-9][a-z0-9-_]{0,79}$/i;
const DISCIPLINES = [
  "software",
  "electrical",
  "robotics",
  "automation",
  "ai",
] as const;

function safePublicHref(value: string): string | undefined {
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  try {
    const url = new URL(value, "https://akb.invalid");
    if (url.origin !== "https://akb.invalid") return undefined;
    if (!SAFE_PUBLIC_PATH.test(url.pathname)) return undefined;
    if (url.hash && !SAFE_SECTION.test(url.hash.slice(1))) return undefined;
    let search = "";
    if (url.pathname === "/projects") {
      const discipline = url.searchParams.get("discipline");
      if (
        discipline &&
        DISCIPLINES.includes(discipline as (typeof DISCIPLINES)[number])
      ) {
        search = `?discipline=${discipline}`;
      }
    }
    return `${url.pathname}${search}${url.hash}`;
  } catch {
    return undefined;
  }
}

export function normalizeAevaPageContext(
  context?: AevaPageContext,
): AevaPageContext | undefined {
  if (!context) return undefined;
  const path = safePublicHref(context.path)?.split(/[?#]/, 1)[0];
  if (!path) return undefined;
  const sectionId =
    context.sectionId && SAFE_SECTION.test(context.sectionId)
      ? context.sectionId
      : undefined;
  return {
    path,
    ...(context.title ? { title: context.title.slice(0, 160) } : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(context.sectionLabel
      ? { sectionLabel: context.sectionLabel.slice(0, 120) }
      : {}),
  };
}

function action(input: Omit<AevaAction, "id">): AevaAction | undefined {
  const href = safePublicHref(input.href);
  if (!href) return undefined;
  return {
    ...input,
    id: `${input.kind}:${href}`,
    href,
  };
}

export function createAevaActions(input: {
  question: string;
  intent: AevaIntent;
  citations: readonly AevaCitation[];
  pageContext?: AevaPageContext;
}): AevaAction[] {
  const candidates: Array<AevaAction | undefined> = [];
  const question = input.question.toLocaleLowerCase("en-IN");

  if (/\b(?:resume|cv|curriculum vitae)\b/i.test(question)) {
    candidates.push(
      action({ kind: "navigate", label: "Open the resume", href: "/resume" }),
    );
  }
  if (
    /\b(?:contact|hire|hiring|collaborat|work with|reach out)\b/i.test(question)
  ) {
    candidates.push(
      action({
        kind: "highlight-section",
        label: "Open contact options",
        href: "/contact#direct-title",
      }),
    );
  }

  const discipline = DISCIPLINES.find((item) =>
    new RegExp(`\\b${item}\\b`, "i").test(question),
  );
  if (
    discipline &&
    /\b(?:project|work|build|portfolio|show|filter)\b/i.test(question)
  ) {
    candidates.push(
      action({
        kind: "filter-projects",
        label: `Show ${discipline} projects`,
        href: `/projects?discipline=${discipline}#project-archive-heading`,
      }),
    );
  } else if (/\b(?:projects?|portfolio work)\b/i.test(question)) {
    candidates.push(
      action({
        kind: "highlight-section",
        label: "Open the project archive",
        href: "/projects#project-archive-heading",
      }),
    );
  }

  if (input.intent === "explain-page" && input.pageContext) {
    candidates.push(
      action({
        kind: input.pageContext.sectionId ? "highlight-section" : "navigate",
        label: input.pageContext.sectionLabel
          ? `Return to ${input.pageContext.sectionLabel}`
          : "Return to this page",
        href: `${input.pageContext.path}${
          input.pageContext.sectionId ? `#${input.pageContext.sectionId}` : ""
        }`,
      }),
    );
  }

  for (const citation of input.citations) {
    const href = safePublicHref(citation.url);
    if (!href) continue;
    candidates.push(
      action({ kind: "navigate", label: `Open ${citation.title}`, href }),
    );
  }

  const seen = new Set<string>();
  return candidates
    .filter((item): item is AevaAction => Boolean(item))
    .filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    })
    .slice(0, 3);
}
