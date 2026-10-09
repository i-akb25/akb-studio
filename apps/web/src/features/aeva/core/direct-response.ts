export type DirectAevaResponse = {
  answer: string;
  kind: "navigation" | "url-guidance";
};

const PURE_URL = /^https?:\/\/\S+$/i;

export function directAevaResponse(
  question: string,
): DirectAevaResponse | undefined {
  const normalized = question.trim();

  if (PURE_URL.test(normalized)) {
    return {
      kind: "url-guidance",
      answer:
        "I can’t treat a pasted URL as a question. Ask what you want to know about that page, or enable live web search when you want me to inspect current public information.",
    };
  }

  if (/\b(?:resume|cv|curriculum vitae)\b/i.test(normalized)) {
    return {
      kind: "navigation",
      answer:
        "You can open Anurag’s interactive resume below. It presents his published experience, education, skills and project evidence.",
    };
  }

  if (
    /\b(?:contact|hire|hiring|collaborat|work with|reach out|get in touch)\b/i.test(
      normalized,
    )
  ) {
    return {
      kind: "navigation",
      answer:
        "You can contact Anurag through the public Contact page below. It contains the appropriate options for professional opportunities and collaboration.",
    };
  }

  return undefined;
}
