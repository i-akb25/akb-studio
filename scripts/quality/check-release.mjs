import { existsSync, readFileSync } from "node:fs";

const required = [
  "apps/web/src/app/manifest.ts",
  "apps/web/public/sw.js",
  "apps/web/src/app/(public)/offline/page.tsx",
  "apps/web/src/features/aeva/components/voice-controls.tsx",
  "apps/web/src/features/cursor/components/smart-cursor.tsx",
  ".github/workflows/codeql.yml",
  ".github/workflows/release-readiness.yml",
  ".github/dependabot.yml",
  ".env.example",
  "apps/web/.env.example",
  "integrations/google-apps-script/Code.gs",
  "integrations/google-apps-script/README.md",
  "README.md",
  "apps/web/src/app/admin/(protected)/release/page.tsx",
  "apps/web/src/features/aeva/core/provider-contract.ts",
  "scripts/quality/production-smoke.mjs",
];
const missing = required.filter((path) => !existsSync(path));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const scripts = [
  "lint",
  "typecheck",
  "test",
  "quality:links",
  "quality:secrets",
  "quality:release",
];
const missingScripts = scripts.filter((name) => !pkg.scripts?.[name]);

if (missing.length || missingScripts.length) {
  console.error(
    [
      ...missing.map((path) => `Missing release file: ${path}`),
      ...missingScripts.map((name) => `Missing package script: ${name}`),
    ].join("\n"),
  );
  process.exit(1);
}
console.log(
  "3.0 release files and scripts are present. Live acceptance is still required.",
);
