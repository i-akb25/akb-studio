import "server-only";

import { consumeRateLimit } from "@/server/security/rate-limit";
import { clientAddress, hasTrustedOrigin } from "@/server/security/request";

const emergencyLimits = new Map<string, { count: number; expiresAt: number }>();

function acceptEmergencyLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  if (!key) return false;
  const now = Date.now();
  if (emergencyLimits.size >= 2_000) {
    for (const [storedKey, value] of emergencyLimits) {
      if (value.expiresAt <= now) emergencyLimits.delete(storedKey);
    }
    if (emergencyLimits.size >= 2_000) {
      const oldestKey = emergencyLimits.keys().next().value;
      if (oldestKey) emergencyLimits.delete(oldestKey);
    }
  }
  const current = emergencyLimits.get(key);
  if (!current || current.expiresAt <= now) {
    emergencyLimits.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

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
  return decision.available
    ? decision.allowed
    : acceptEmergencyLimit(decision.key, limit, 15 * 60 * 1_000);
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
