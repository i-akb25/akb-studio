import "server-only";

import { consumeRateLimit } from "@/server/security/rate-limit";
import { clientAddress, hasTrustedOrigin } from "@/server/security/request";

export async function acceptAevaRequest(request: Request): Promise<boolean> {
  const decision = await consumeRateLimit({
    scope: "aeva:address",
    identifier: clientAddress(request),
    limit: 12,
    windowMs: 15 * 60 * 1_000,
  });
  return decision.allowed;
}

export const hasValidAevaOrigin = hasTrustedOrigin;

// Detection improves the reply, but is never treated as the security boundary.
export { isPrivateLifeQuestion, isPromptInjection } from "./aeva-policy";
