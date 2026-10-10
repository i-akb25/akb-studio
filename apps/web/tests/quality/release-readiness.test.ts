import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { releaseReadiness } from "../../src/features/operations/release-readiness";

test("launch configuration reports missing and partial groups without secrets", () => {
  const findings = releaseReadiness({
    GEMINI_API_KEY: "sensitive-gemini-value",
    AEVA_PUBLIC_ENABLED: "true",
    CLOUDINARY_API_KEY: "sensitive-media-value",
    BETTER_AUTH_SECRET: "short",
    ABUSE_HASH_SECRET: "GENERATE_A_DIFFERENT_RANDOM_SECRET",
  });
  assert.equal(
    findings.find((item) => item.id === "provider")?.state,
    "configured",
  );
  assert.equal(findings.find((item) => item.id === "media")?.state, "blocked");
  assert.equal(findings.find((item) => item.id === "auth")?.state, "blocked");
  assert.equal(findings.find((item) => item.id === "abuse")?.state, "blocked");
  assert.doesNotMatch(JSON.stringify(findings), /sensitive-/);
});

test("origin mismatch is blocked and enabled web is never called verified", () => {
  const findings = releaseReadiness({
    NEXT_PUBLIC_SITE_URL: "https://example.com",
    BETTER_AUTH_URL: "https://other.example.com",
    AEVA_WEB_SEARCH_ENABLED: "true",
  });
  assert.equal(findings.find((item) => item.id === "origin")?.state, "blocked");
  assert.equal(
    findings.find((item) => item.id === "live-web")?.state,
    "review",
  );
});

test("release diagnostics are owner-only and private routes are non-cacheable", async () => {
  const page = await readFile(
    path.resolve(
      import.meta.dirname,
      "../../src/app/admin/(protected)/release/page.tsx",
    ),
    "utf8",
  );
  const proxy = await readFile(
    path.resolve(import.meta.dirname, "../../src/proxy.ts"),
    "utf8",
  );
  assert.match(page, /requireAdmin\("users:manage"\)/);
  assert.match(proxy, /private, no-store, max-age=0/);
});

test("release workflow passes URL as data, not executable shell content", async () => {
  const workflow = await readFile(
    path.resolve(
      import.meta.dirname,
      "../../../../.github/workflows/release-readiness.yml",
    ),
    "utf8",
  );
  assert.match(
    workflow,
    /PRODUCTION_ORIGIN: \$\{\{ inputs.production_url \}\}/,
  );
  assert.doesNotMatch(workflow, /run:.*\$\{\{ inputs.production_url/);
});

test("bundled fonts preserve all families and do not depend on a network build fetch", async () => {
  const app = path.resolve(import.meta.dirname, "../../src/app");
  const layout = await readFile(path.join(app, "layout.tsx"), "utf8");
  const css = await readFile(path.join(app, "fonts.css"), "utf8");
  assert.doesNotMatch(layout, /next\/font\/google/);
  for (const family of ["Inter", "Space Grotesk", "JetBrains Mono"])
    assert.ok(css.includes(`font-family: ${family};`));
  const fonts = [...css.matchAll(/url\(\/fonts\/([^)]+)\)/g)];
  assert.equal(fonts.length, 16);
  for (const font of fonts)
    assert.ok(
      (await stat(path.resolve(app, "../../public/fonts", font[1] ?? "")))
        .size > 1000,
    );
  assert.match(layout, /href="\/fonts\/inter-latin.woff2"/);
});

test("Turbo passes application configuration and invalidates builds when local settings change", async () => {
  const config = JSON.parse(
    await readFile(
      path.resolve(import.meta.dirname, "../../../../turbo.json"),
      "utf8",
    ),
  );
  for (const variable of [
    "BETTER_AUTH_*",
    "AEVA_*",
    "DATABASE_URL",
    "GEMINI_API_KEY",
    "AKB_*",
    "APPS_SCRIPT_SIGNING_SECRET",
  ])
    assert.ok(config.globalEnv.includes(variable));
  assert.ok(config.tasks.build.inputs.includes(".env.*"));
});
