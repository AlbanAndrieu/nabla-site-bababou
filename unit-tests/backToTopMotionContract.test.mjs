import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Next back-to-top honors the browser reduced-motion setting", () => {
  const source = readFileSync(new URL("../components/BackToTopButton.tsx", import.meta.url), "utf8");
  assert.match(source, /window\.matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
  assert.match(source, /behavior: reducedMotion \? "auto" : "smooth"/);
  assert.match(source, /window\.history\.replaceState\(/);
  assert.match(source, /#top/);
});
