import { type NextRequest, NextResponse } from "next/server";

const NOINDEX_PREFIXES = ["/admin", "/api", "/preview", "/private"];
const NOINDEX_VALUE = "noindex, nofollow, noarchive";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (matchesPrefix(pathname, "/writing")) {
    const destination = request.nextUrl.clone();
    destination.pathname = pathname.replace(/^\/writing/, "/journal");
    return NextResponse.redirect(destination, 308);
  }

  const response = NextResponse.next();
  if (
    ["/admin", "/api/admin", "/api/auth"].some((prefix) =>
      matchesPrefix(pathname, prefix),
    )
  ) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  if (NOINDEX_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    response.headers.set("X-Robots-Tag", NOINDEX_VALUE);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/preview/:path*",
    "/private/:path*",
    "/writing",
    "/writing/:path*",
  ],
};
