export function isPromptInjection(question: string): boolean {
  return /(?:ignore|override|reveal|print|repeat).{0,35}(?:system|developer|hidden|prompt|instruction)|(?:admin|private database|secret key|environment variable)/i.test(
    question,
  );
}

export function isPrivateLifeQuestion(question: string): boolean {
  return /\b(?:girlfriend|boyfriend|dating|relationship status|love life|crush|married|wife|romantic)\b/i.test(
    question,
  );
}
