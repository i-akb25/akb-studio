import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

const root = process.cwd();
const app = join(root, "apps/web/src/app");
const publicDir = join(root, "apps/web/public");

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const routes = files(app)
  .filter((path) => path.endsWith(`${sep}page.tsx`))
  .map((path) => {
    const parts = relative(app, path)
      .split(sep)
      .slice(0, -1)
      .filter((part) => !part.startsWith("("));
    const pattern = `/${parts.join("/")}`.replace(/\/$/, "") || "/";
    return new RegExp(
      `^${pattern.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+")}/?$`,
    );
  });

const broken = [];
for (const path of files(join(root, "apps/web/src")).filter((item) =>
  /\.(tsx?|mdx?)$/.test(item),
)) {
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(
    /(?:href|src)=["'](\/[A-Za-z0-9_./#?=-]*)["']/g,
  )) {
    const value = match[1];
    const pathname = value.split(/[?#]/)[0] || "/";
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/") ||
      pathname === "/manifest.webmanifest"
    )
      continue;
    if (extname(pathname)) {
      if (!existsSync(join(publicDir, pathname)))
        broken.push(`${relative(root, path)} -> ${value}`);
    } else if (!routes.some((route) => route.test(pathname))) {
      broken.push(`${relative(root, path)} -> ${value}`);
    }
  }
}

if (broken.length) {
  console.error(`Broken internal links:\n${broken.join("\n")}`);
  process.exit(1);
}
console.log(`Internal link gate passed (${routes.length} application routes).`);
