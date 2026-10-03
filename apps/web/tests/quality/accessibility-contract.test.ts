import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const webRoot = path.resolve(import.meta.dirname, "../..");

async function source(relativePath: string) {
  return readFile(path.join(webRoot, relativePath), "utf8");
}

test("global accessibility contract includes focus and reduced-motion fallbacks", async () => {
  const css = await source("src/app/globals.css");

  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /animation-duration:\s*0\.01ms/);
});

test("primary navigation and hero expose the contact and profile routes", async () => {
  const [header, profileLinks, hero] = await Promise.all([
    source("src/components/layout/site-header.tsx"),
    source("src/components/brand/profile-links.ts"),
    source("src/features/homepage/components/hero/hero-content.tsx"),
  ]);

  assert.match(header, /label: "Contact", href: "\/contact"/);
  assert.match(profileLinks, /mailto:anuragbhartiee25@gmail\.com/);
  assert.match(profileLinks, /instagram\.com\/urr_anurag\.akb/);
  assert.match(hero, /<HeroSocialLinks \/>/);
});

test("every homepage technology logo resolves to a local asset", async () => {
  const component = await source(
    "src/features/homepage/components/skills/skill-domain.tsx",
  );
  const assetPaths = [...component.matchAll(/"(\/skills\/[^"]+\.svg)"/g)].map(
    (match) => match[1],
  );

  assert.ok(assetPaths.length >= 7);

  await Promise.all(
    assetPaths.map((assetPath) =>
      access(path.join(webRoot, "public", assetPath.replace(/^\//, ""))),
    ),
  );
});

test("reflection audio requires an explicit control", async () => {
  const reflection = await source(
    "src/features/homepage/components/reflection/reflection-sound.tsx",
  );

  assert.doesNotMatch(reflection, /onPointerEnter|onPointerUp/);
  assert.match(reflection, /aria-pressed=\{isPlaying\}/);
});
