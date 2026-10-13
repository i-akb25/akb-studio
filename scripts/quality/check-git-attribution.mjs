import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const aiIdentity =
  /\b(?:codex|claude|copilot|gemini|chatgpt|openai|anthropic|cursor(?:\[bot\])?)\b/i;

export function attributionFindings({
  author = "",
  committer = "",
  message = "",
}) {
  const findings = [];
  if (aiIdentity.test(author)) findings.push("AI author identity");
  if (aiIdentity.test(committer)) findings.push("AI committer identity");
  for (const line of message.split(/\r?\n/)) {
    if (/^\s*Co-authored-by\s*:/i.test(line) && aiIdentity.test(line))
      findings.push("AI co-author trailer");
  }
  return findings;
}

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function main() {
  const mode = process.argv[2];
  if (mode === "--identity") {
    const findings = attributionFindings({
      author: git(["var", "GIT_AUTHOR_IDENT"]),
      committer: git(["var", "GIT_COMMITTER_IDENT"]),
    });
    if (findings.length) throw new Error(findings.join(", "));
  } else if (mode === "--message") {
    const file = process.argv[3];
    if (!file) throw new Error("Missing commit message file.");
    const findings = attributionFindings({
      message: readFileSync(file, "utf8"),
    });
    if (findings.length) throw new Error(findings.join(", "));
  } else {
    if (mode) throw new Error("Unsupported attribution-check option.");
    if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true")
      throw new Error(
        "Full-history check requires git fetch --unshallow origin first.",
      );
    const records = git([
      "log",
      "--all",
      "--format=%H%x00%an <%ae>%x00%cn <%ce>%x00%B%x00",
    ]).split("\0");
    const failures = [];
    for (let index = 0; index + 3 < records.length; index += 4) {
      const [hash, author, committer, message] = records.slice(
        index,
        index + 4,
      );
      const findings = attributionFindings({ author, committer, message });
      if (findings.length)
        failures.push(`${hash.trim()}: ${findings.join(", ")}`);
    }
    if (failures.length) throw new Error(failures.join("\n"));
  }
  console.log(
    "Git attribution check passed. This does not refresh GitHub's contributor display.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Git attribution check failed.",
    );
    process.exitCode = 1;
  }
}
