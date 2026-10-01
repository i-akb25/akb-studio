import { consumeRateLimit } from "@/server/security/rate-limit";
import { clientAddress } from "@/server/security/request";

export async function acceptPrivacyRequest(request: Request, email: string) {
  const [addressLimit, emailLimit] = await Promise.all([
    consumeRateLimit({
      scope: "privacy:address",
      identifier: clientAddress(request),
      limit: 3,
      windowMs: 15 * 60 * 1_000,
    }),
    consumeRateLimit({
      scope: "privacy:email",
      identifier: email,
      limit: 3,
      windowMs: 15 * 60 * 1_000,
    }),
  ]);
  return addressLimit.allowed && emailLimit.allowed;
}
