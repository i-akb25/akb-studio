import "server-only";

export class RequestSecurityError extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    message: string,
  ) {
    super(message);
  }
}

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

export async function readJsonBody(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json"))
    throw new RequestSecurityError(415, "Unsupported request format.");

  const declaredBytes = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredBytes) && declaredBytes > maximumBytes)
    throw new RequestSecurityError(413, "Request is too large.");

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maximumBytes)
    throw new RequestSecurityError(413, "Request is too large.");
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new RequestSecurityError(400, "Invalid request.");
  }
}

export function clientAddress(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
