import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import {
  createThemeBootstrapScript,
  nextResolvedTheme,
  resolveTheme,
} from "../../src/features/theme/theme-config";

function runBootstrap(input: {
  storedTheme: string | null;
  prefersDark: boolean;
  storageThrows?: boolean;
}) {
  const classes = new Set<string>();
  const style: { colorScheme?: string } = {};
  const context = {
    localStorage: {
      getItem() {
        if (input.storageThrows) throw new Error("Storage unavailable");
        return input.storedTheme;
      },
    },
    matchMedia() {
      return { matches: input.prefersDark };
    },
    document: {
      documentElement: {
        classList: {
          toggle(name: string, active: boolean) {
            if (active) classes.add(name);
            else classes.delete(name);
          },
        },
        style,
      },
    },
  };

  vm.runInNewContext(createThemeBootstrapScript(), context);
  return { classes, style };
}

test("a stored dark choice is applied before hydration", () => {
  const result = runBootstrap({ storedTheme: "dark", prefersDark: false });
  assert.equal(result.classes.has("dark"), true);
  assert.equal(result.style.colorScheme, "dark");
});

test("a stored light choice overrides a dark system preference", () => {
  const result = runBootstrap({ storedTheme: "light", prefersDark: true });
  assert.equal(result.classes.has("dark"), false);
  assert.equal(result.style.colorScheme, "light");
});

test("system preference is used without a stored choice", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme(null, false), "light");
  assert.equal(
    runBootstrap({ storedTheme: null, prefersDark: true }).classes.has("dark"),
    true,
  );
});

test("system preference remains available when storage is blocked", () => {
  const result = runBootstrap({
    storedTheme: null,
    prefersDark: true,
    storageThrows: true,
  });
  assert.equal(result.classes.has("dark"), true);
  assert.equal(result.style.colorScheme, "dark");
});

test("toggle state changes in both directions", () => {
  assert.equal(nextResolvedTheme("dark"), "light");
  assert.equal(nextResolvedTheme("light"), "dark");
});
