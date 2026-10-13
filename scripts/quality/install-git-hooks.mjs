import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, readdirSync } from "node:fs";

const current = spawnSync(
  "git",
  ["config", "--local", "--get", "core.hooksPath"],
  {
    encoding: "utf8",
  },
);
if (![0, 1].includes(current.status))
  throw new Error("Cannot inspect local Git hook configuration.");
if (current.stdout.trim() && current.stdout.trim() !== ".githooks")
  throw new Error(
    "An existing core.hooksPath is configured. Integrate the checks into your existing hooks; no settings were overwritten.",
  );
if (!current.stdout.trim()) {
  const hooksDirectory = execFileSync(
    "git",
    ["rev-parse", "--git-path", "hooks"],
    {
      encoding: "utf8",
    },
  ).trim();
  const existing = readdirSync(hooksDirectory).filter(
    (name) => !name.endsWith(".sample"),
  );
  if (existing.length)
    throw new Error(
      "Existing default Git hooks were found. Integrate the checks manually; no hooks or settings were overwritten.",
    );
}
for (const hook of ["pre-commit", "commit-msg", "pre-push"])
  chmodSync(`.githooks/${hook}`, 0o755);
execFileSync("git", ["config", "--local", "core.hooksPath", ".githooks"]);
console.log(
  "Local attribution hooks enabled. Hooks can be bypassed; CI also checks reachable history.",
);
