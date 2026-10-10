import "server-only";

export {
  RequestSecurityError,
  readJsonBody,
  readLimitedBody,
} from "./body-limit";

export function hasTrustedOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site")
    return false;

  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";

  const allowed = new Set<string>();
  for (const candidate of [request.url, process.env.NEXT_PUBLIC_SITE_URL]) {
    if (!candidate) continue;
    try {
      allowed.add(new URL(candidate).origin);
    } catch {}
  }
  return allowed.has(origin);
}

export function clientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
