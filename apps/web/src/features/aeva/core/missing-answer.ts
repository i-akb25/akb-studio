import type { AevaAction } from "../model";

export function missingAnswer(question: string): {
  answer: string;
  actions: AevaAction[];
} {
  const person = question
    .match(/^\s*who (?:is|was)\s+([\p{L}][\p{L} '-]{0,60})[?.!]*$/iu)?.[1]
    ?.trim();
  if (person && !/\b(?:anurag|ace|aeva|he|she|your|his)\b/i.test(person))
    return {
      answer: `Which ${person} do you mean? A little context would help.`,
      actions: [],
    };
  const relevantPage =
    /\b(?:experience|education|qualification|employment|internship)\b/i.test(
      question,
    )
      ? ["/resume", "View resume"]
      : /\b(?:projects?|software work|engineering work)\b/i.test(question)
        ? ["/projects", "View projects"]
        : undefined;
  if (relevantPage)
    return {
      answer:
        "I don’t have a confirmed answer to that specific detail. You can check the relevant published page below, or ask Anurag through Contact.",
      actions: [
        {
          id: "related-page",
          kind: "navigate",
          href: relevantPage[0],
          label: relevantPage[1],
        },
        {
          id: "contact",
          kind: "navigate",
          href: "/contact",
          label: "Contact Anurag",
        },
      ],
    };
  if (
    /\b(?:anurag|ace|he|his|married|girlfriend|dating|best friend)\b/i.test(
      question,
    )
  )
    return {
      answer:
        "Anurag hasn’t shared an approved public answer to that. You can ask him directly through the Contact page.",
      actions: [
        {
          id: "contact",
          kind: "navigate",
          href: "/contact",
          label: "Contact Anurag",
        },
      ],
    };
  return {
    answer:
      "I don’t have reliable information for that question yet. Could you add a little context? For a current public topic, you can enable live web search.",
    actions: [],
  };
}
