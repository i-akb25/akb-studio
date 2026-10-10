import { pathToFileURL } from "node:url";

export function productionOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "Supply an HTTPS production origin without a path, credentials, query or fragment.",
    );
  return url.origin;
}

export async function productionSmoke(value) {
  const origin = productionOrigin(value);
  const checks = [
    ...[
      "/",
      "/projects",
      "/journal",
      "/knowledge",
      "/about",
      "/contact",
      "/resume",
      "/pravaah",
      "/lab",
      "/aeva",
      "/offline",
      "/privacy",
      "/api/health/live",
      "/api/health",
    ].map((route) => ({ route, status: 200 })),
    { route: "/admin", status: 307, location: "/admin/login" },
    { route: "/api/admin/media", status: 401 },
  ];
  let failures = 0;
  // GET-only: never submit a form, send a message or change a record.
  for (const check of checks) {
    const started = Date.now();
    try {
      const response = await fetch(`${origin}${check.route}`, {
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      const issues = [];
      if (response.status !== check.status)
        issues.push(`expected ${check.status}, got ${response.status}`);
      if (response.headers.get("x-content-type-options") !== "nosniff")
        issues.push("missing nosniff");
      if (!response.headers.get("content-security-policy"))
        issues.push("missing CSP");
      if (!response.headers.get("strict-transport-security"))
        issues.push("missing HSTS");
      if (
        check.location &&
        new URL(response.headers.get("location") || "/", origin).pathname !==
          check.location
      )
        issues.push("unexpected admin redirect");
      if (
        check.route === "/api/admin/media" &&
        !response.headers.get("cache-control")?.includes("no-store")
      )
        issues.push("missing private no-store");
      if (check.route === "/api/health") {
        const health = await response.json();
        if (health.status !== "ok" || health.database !== "available")
          issues.push("database health is not available");
      } else await response.body?.cancel();
      console.log(
        `${issues.length ? "FAIL" : "PASS"} ${check.route} (${Date.now() - started} ms)${issues.length ? `: ${issues.join(", ")}` : ""}`,
      );
      if (issues.length) failures++;
    } catch {
      failures++;
      console.log(`FAIL ${check.route}: request failed or exceeded 30 seconds`);
    }
  }
  console.log(
    "GET-only smoke checks do not verify authenticated workflows, layout or external delivery.",
  );
  return failures;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const origin = process.argv.slice(2).find((argument) => argument !== "--");
    process.exitCode = (await productionSmoke(origin)) ? 1 : 0;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
