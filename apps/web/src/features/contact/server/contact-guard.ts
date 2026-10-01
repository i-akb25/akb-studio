import type { ContactSubmission } from "@/features/contact/server/contact-schema";
import {
  consumeRateLimit,
  releaseRateLimit,
} from "@/server/security/rate-limit";
import { clientAddress, hasTrustedOrigin } from "@/server/security/request";

const WINDOW_MS = 15 * 60 * 1_000;

export const contactClientAddress = clientAddress;
export const hasValidContactOrigin = hasTrustedOrigin;

export function submissionTimingIsValid(startedAt: number): boolean {
  const elapsed = Date.now() - startedAt;
  return elapsed >= 2_000 && elapsed <= 24 * 60 * 60 * 1_000;
}

export async function checkContactLimits(
  request: Request,
  submission: ContactSubmission,
): Promise<{
  status: "allowed" | "duplicate" | "rate_limited";
  duplicateKey?: string;
}> {
  const [addressLimit, emailLimit] = await Promise.all([
    consumeRateLimit({
      scope: "contact:address",
      identifier: clientAddress(request),
      limit: 5,
      windowMs: WINDOW_MS,
    }),
    consumeRateLimit({
      scope: "contact:email",
      identifier: submission.email,
      limit: 3,
      windowMs: WINDOW_MS,
    }),
  ]);
  if (!addressLimit.allowed || !emailLimit.allowed)
    return { status: "rate_limited" };

  const duplicate = await consumeRateLimit({
    scope: "contact:duplicate",
    identifier: [
      submission.email,
      submission.category,
      submission.subject,
      submission.message,
    ].join(":"),
    limit: 1,
    windowMs: 10 * 60 * 1_000,
  });
  return duplicate.allowed
    ? { status: "allowed", duplicateKey: duplicate.key }
    : { status: "duplicate" };
}

export async function releaseContactDuplicate(duplicateKey?: string) {
  await releaseRateLimit(duplicateKey);
}

export async function verifyTurnstile(
  token: string | undefined,
  request: Request,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: clientAddress(request),
  });
  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return response.ok && result.success === true;
  } catch {
    return false;
  }
}
