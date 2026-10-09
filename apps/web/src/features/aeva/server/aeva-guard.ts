import "server-only";

import { consumeRateLimit } from "@/server/security/rate-limit";
import { clientAddress, hasTrustedOrigin } from "@/server/security/request";

async function acceptRequest(
  request: Request,
  scope: string,
  limit: number,
): Promise<boolean> {
  const decision = await consumeRateLimit({
    scope,
    identifier: clientAddress(request),
    limit,
    windowMs: 15 * 60 * 1_000,
  });
  return decision.allowed;
}

export function acceptAevaRequest(request: Request): Promise<boolean> {
  return acceptRequest(request, "aeva:chat:address", 12);
}

export function acceptAevaFeedbackRequest(request: Request): Promise<boolean> {
  return acceptRequest(request, "aeva:feedback:address", 30);
}

export const hasValidAevaOrigin = hasTrustedOrigin;

// Detection improves the reply, but is never treated as the security boundary.
export { isPrivateLifeQuestion, isPromptInjection } from "./aeva-policy";
