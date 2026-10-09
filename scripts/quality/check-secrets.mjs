import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"])
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const forbiddenFiles = tracked.filter(
  (path) => /(^|\/)\.env(?:\.|$)/.test(path) && !path.endsWith(".env.example"),
);
const forbiddenInternalDocs = tracked.filter((path) =>
  /^docs\/aeva-.*\.md$/i.test(path),
);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[A-Za-z0-9_-]{30,}\b/,
  /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
];
const findings = [];

for (const path of tracked) {
  if (
    /^(?:pnpm-lock\.yaml|apps\/web\/tests\/|scripts\/quality\/check-secrets\.mjs)/.test(
      path,
    )
  )
    continue;
  let stats;
  try {
    stats = statSync(path);
  } catch {
    continue;
  }
  if (!stats.isFile() || stats.size > 1_000_000) continue;
  const content = readFileSync(path, "utf8");
  if (patterns.some((pattern) => pattern.test(content))) findings.push(path);
}

if (forbiddenFiles.length || forbiddenInternalDocs.length || findings.length) {
  console.error(
    [
      ...forbiddenFiles.map((path) => `Tracked environment file: ${path}`),
      ...forbiddenInternalDocs.map(
        (path) => `Tracked internal Aeva document: ${path}`,
      ),
      ...findings.map((path) => `Possible secret: ${path}`),
    ].join("\n"),
  );
  process.exit(1);
}
console.log("Secret and tracked-environment-file gate passed.");
