import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const responsiveSpecPath = new URL(
  "../tests/responsive.spec.ts",
  import.meta.url,
);

test("responsive Playwright matrix keeps the shared priority breakpoints", async () => {
  const source = await readFile(responsiveSpecPath, "utf8");

  for (const width of [320, 375, 768, 1024, 1440]) {
    assert.match(
      source,
      new RegExp(`width:\\s*${width}\\b`),
      `missing responsive width ${width}px`,
    );
  }

  for (const route of ["/contact", "/de/contact", "/policy"]) {
    assert.ok(
      source.includes(`"${route}"`),
      `missing responsive route ${route}`,
    );
  }

  assert.match(source, /hasHorizontalScroll/);
  assert.match(source, /toBeGreaterThanOrEqual\(44\)/);
  assert.match(source, /#route-header-locale/);
});

test("responsive Playwright matrix preserves 200 percent reflow and reduced motion", async () => {
  const source = await readFile(responsiveSpecPath, "utf8");

  assert.match(
    source,
    /setProperty\(\s*"font-size",\s*"200%",\s*"important"\s*\)/,
  );
  assert.match(source, /reducedMotion:\s*"reduce"/);
  assert.match(source, /rootFontSize/);
  assert.match(source, /toBeGreaterThanOrEqual\(32\)/);
  assert.match(source, /scrollBehavior/);
  assert.match(source, /transitionDurationMs/);
  assert.match(source, /animationDurationMs/);
  assert.match(source, /toBeLessThanOrEqual\(0\.02\)/);
  assert.match(source, /reflow without horizontal scrolling at 200% text/);
});
