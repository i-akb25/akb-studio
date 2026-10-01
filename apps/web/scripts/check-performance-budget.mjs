import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const buildRoot = path.resolve(process.cwd(), ".next");
const pagePath = path.join(buildRoot, "server", "app", "index.html");
const buildManifestPath = path.join(buildRoot, "build-manifest.json");
const maximumApplicationJavaScript = 150 * 1024;

const html = await readFile(pagePath, "utf8").catch(() => {
  throw new Error(
    "The production homepage was not found. Run the production build before performance:budget.",
  );
});
const buildManifest = JSON.parse(await readFile(buildManifestPath, "utf8"));
const runtimeSources = new Set(
  [...buildManifest.rootMainFiles, ...buildManifest.polyfillFiles].map(
    (source) => `/_next/${source}`,
  ),
);

const scriptSources = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(
  (match) => match[1],
);

const uniqueSources = [...new Set(scriptSources)];
let gzipBytes = 0;
let applicationRawBytes = 0;
let applicationGzipBytes = 0;

for (const source of uniqueSources) {
  const relativePath = source.replace(/^\/_next\//, "");
  const filePath = path.join(buildRoot, relativePath);
  const contents = await readFile(filePath);
  const fileSize = (await stat(filePath)).size;
  const gzipSize = gzipSync(contents).byteLength;

  gzipBytes += gzipSize;

  if (!runtimeSources.has(source)) {
    applicationRawBytes += fileSize;
    applicationGzipBytes += gzipSize;
  }
}

const formatKilobytes = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

console.log(
  `Homepage JavaScript: ${formatKilobytes(applicationGzipBytes)} application gzip (${formatKilobytes(applicationRawBytes)} raw); ${formatKilobytes(gzipBytes)} total gzip including Next.js, React, and legacy polyfills.`,
);

if (applicationGzipBytes > maximumApplicationJavaScript) {
  throw new Error(
    `Application JavaScript exceeds the ${formatKilobytes(maximumApplicationJavaScript)} gzip budget.`,
  );
}
