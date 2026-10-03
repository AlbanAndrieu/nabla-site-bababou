import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("axe audit stays pinned, bounded and aligned with Bababou locale routing", async () => {
  const [pkgRaw, lock, spec] = await Promise.all([
    read("package.json"),
    read("package-lock.json"),
    read("tests/accessibility-axe.spec.ts"),
  ]);
  const pkg = JSON.parse(pkgRaw) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.equal(pkg.devDependencies?.["@axe-core/playwright"], "4.13.0");
  assert.equal(pkg.scripts?.["test:a11y"], "bash scripts/run-a11y-local.sh");
  assert.match(lock, /"node_modules\/@axe-core\/playwright"/);
  assert.match(lock, /"version": "4\.13\.0"/);

  for (const route of ["/contact", "/en/contact", "/policy", "/en/policy"]) assert.ok(spec.includes(JSON.stringify(route)));
  for (const tag of ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]) assert.ok(spec.includes(JSON.stringify(tag)));
  assert.match(spec, /main#main-content/);
  assert.doesNotMatch(spec, /\/security/);
});
