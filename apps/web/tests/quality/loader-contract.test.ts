import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  createBrandIntroBootstrapScript,
  shouldShowBrandIntro,
} from "../../src/features/loader/loader-config";

const webRoot = path.resolve(import.meta.dirname, "../..");

test("first-session introduction respects session, motion and data preferences", () => {
  assert.equal(
    shouldShowBrandIntro({
      seen: false,
      reducedMotion: false,
      saveData: false,
    }),
    true,
  );
  assert.equal(
    shouldShowBrandIntro({ seen: true, reducedMotion: false, saveData: false }),
    false,
  );
  assert.equal(
    shouldShowBrandIntro({ seen: false, reducedMotion: true, saveData: false }),
    false,
  );
  assert.equal(
    shouldShowBrandIntro({ seen: false, reducedMotion: false, saveData: true }),
    false,
  );
});

test("bootstrap uses session storage without delaying application readiness", () => {
  const script = createBrandIntroBootstrapScript();
  assert.match(script, /sessionStorage/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /saveData/);
  assert.doesNotMatch(script, /setTimeout|setInterval/);
});

test("loader uses exact production logo assets and remains isolated", async () => {
  const [mark, layout, loader] = await Promise.all([
    readFile(
      path.join(
        webRoot,
        "src/features/loader/components/akb-construction-mark.tsx",
      ),
      "utf8",
    ),
    readFile(path.join(webRoot, "src/app/layout.tsx"), "utf8"),
    readFile(
      path.join(webRoot, "src/features/loader/components/app-loader.tsx"),
      "utf8",
    ),
  ]);

  assert.match(mark, /\/brand\/akb-logo-dark\.svg/);
  assert.match(mark, /\/brand\/akb-logo-light\.svg/);
  assert.match(layout, /FirstSessionBrandIntro/);
  assert.doesNotMatch(layout, /<AppLoader/);
  assert.match(loader, /role="status"/);
  assert.match(loader, /aria-busy/);
  assert.match(loader, /Loading AKB Studio/);
});

test("the native cursor is hidden only after the custom cursor is ready", async () => {
  const [cursor, globals] = await Promise.all([
    readFile(
      path.join(webRoot, "src/features/cursor/components/smart-cursor.tsx"),
      "utf8",
    ),
    readFile(path.join(webRoot, "src/app/globals.css"), "utf8"),
  ]);

  assert.match(cursor, /data-smart-cursor/);
  assert.match(cursor, /data-visible/);
  assert.match(globals, /html\[data-smart-cursor="ready"\]/);
  assert.doesNotMatch(
    globals,
    /(?:^|\n)\s*\.portfolio-shell\s*\{\s*cursor:\s*none/,
  );
});
