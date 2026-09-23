import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const visualSpecPath = new URL(
  "../tests/priority-theme-visual.spec.ts",
  import.meta.url,
);

test("priority visual regression matrix covers native Bababou routes and theme modes", async () => {
  const source = await readFile(visualSpecPath, "utf8");

  for (const route of [
    "/contact",
    "/policy",
    "/central-authorities",
    "/central-authorities-failures",
    "/nre",
    "/email",
  ]) {
    assert.ok(source.includes(`"${route}"`), `missing priority route ${route}`);
  }

  assert.match(source, /site-theme-preference/);
  assert.match(source, /\["light", "dark"\] as const/);
  assert.match(source, /selectThemePreference\(page, "auto", colorScheme\)/);
  assert.match(source, /toBeGreaterThanOrEqual\(4\.5\)/);
  assert.match(source, /scrollWidth/);
  assert.match(source, /clientWidth/);
  assert.match(source, /overflow\.clientWidth \+ 1/);
});

test("priority visual regression checks all semantic contrast token pairs", async () => {
  const source = await readFile(visualSpecPath, "utf8");

  for (const [foreground, background] of [
    ["--ui-text-primary", "--ui-surface"],
    ["--ui-text-primary", "--ui-surface-card"],
    ["--ui-text-secondary", "--ui-surface"],
    ["--ui-chrome-text", "--ui-chrome-surface"],
    ["--ui-info-text", "--ui-info-surface"],
    ["--ui-success-text", "--ui-success-surface"],
    ["--ui-warning-text", "--ui-warning-surface"],
    ["--ui-danger-text", "--ui-danger-surface"],
  ]) {
    assert.ok(
      source.includes(`["${foreground}", "${background}"]`),
      `missing contrast pair ${foreground} / ${background}`,
    );
  }
});
