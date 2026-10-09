export function isPromptInjection(question: string): boolean {
  return /(?:ignore|override|bypass|reveal|print|repeat|exfiltrate).{0,50}(?:system|developer|hidden|prompt|instruction|restriction|policy)|(?:admin (?:record|data)|private (?:database|data|document|memory|contact)|secret key|environment variable|oauth token|contact submission|authentication record)/i.test(
    question,
  );
}

export function isPrivateLifeQuestion(question: string): boolean {
  return /\b(?:girlfriend|boyfriend|dating|relationship status|love life|crush|married|wife|romantic)\b/i.test(
    question,
  );
}
