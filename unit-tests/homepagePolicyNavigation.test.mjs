import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("one shared legal footer replaces duplicate homepage policy section", () => {
  const shared = read("app/components/Footer.tsx");
  const layout = read("app/[locale]/layout.tsx");
  assert.match(layout, /<Footer/);
  assert.match(shared, /href="\/policy\/legal"/);
  for (const p of ["app/[locale]/page.tsx", "app/[locale]/home-preview/page.tsx"]) {
    const page = read(p);
    assert.doesNotMatch(page, /LegacyFooterSection|preview-policies-heading|preview-footer/);
    assert.doesNotMatch(page, /href="\/(?:eleonore-)?feed\.xml"|preview-resources/);
  }
});

test("RSS endpoints remain available to existing subscribers, without duplicate homepage UI", () => {
  const footer = read("app/components/Footer.tsx");
  assert.doesNotMatch(footer, /href="\/(?:eleonore-)?feed\.xml"/);
  const layout = read("app/[locale]/layout.tsx");
  assert.match(layout, /title="Bababou — RSS"/);
  assert.match(layout, /href="\/eleonore-feed\.xml"/);
});

test("legacy policy component is no longer rendered by either React homepage", () => {
  const legacy = read("components/home/LegacyFooterSection.tsx");
  assert.match(legacy, /localizedPolicyPath\(slug, locale\)/);
  assert.match(read("app/components/Footer.tsx"), /<BackToTopButton/);
  assert.doesNotMatch(read("app/[locale]/page.tsx"), /LegacyFooterSection/);
  assert.doesNotMatch(read("app/[locale]/home-preview/page.tsx"), /LegacyFooterSection/);
});
