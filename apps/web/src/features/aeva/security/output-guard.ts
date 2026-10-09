import { clampWords } from "../core/response-contract";

const FORBIDDEN_OUTPUT = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\b(?:sk|AIza|ghp|github_pat)_[A-Za-z0-9_-]{16,}\b/,
  /\b(?:DATABASE_URL|BETTER_AUTH_SECRET|GMAIL_REFRESH_TOKEN|GEMINI_API_KEY)\s*=/i,
  /\b(?:system|developer) (?:prompt|message)\s*:/i,
];

export function safeAevaAnswer(value: string, maxWords: number): string | null {
  const normalized = value.split(String.fromCharCode(0)).join("").trim();
  if (
    !normalized ||
    FORBIDDEN_OUTPUT.some((pattern) => pattern.test(normalized))
  ) {
    return null;
  }
  return clampWords(normalized, maxWords);
}
