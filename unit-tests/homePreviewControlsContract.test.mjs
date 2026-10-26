import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("the Next shared footer owns native theme and print controls", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  const control = read("components/SiteDisplayControls.tsx");
  const boot = read("components/ThemeBootstrap.tsx");
  const footer = read("app/components/Footer.tsx");
  assert.match(footer, /<SiteDisplayControls\s*\/>/);
  assert.doesNotMatch(page, /<SiteDisplayControls\s*\/>/);
  assert.doesNotMatch(page, /HOMEPAGE_PREVIEW_ENABLED/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(boot, /site-theme-preference/);
  assert.match(control, /site-theme-preference/);
  for (const theme of ["light", "dark", "auto"]) {
    assert.match(control, new RegExp('value: "' + theme + '"'));
  }
  assert.match(control, /aria-pressed=\{preference === value\}/);
  assert.match(control, /window\.localStorage\.setItem\(STORAGE_KEY, value\)/);
  assert.match(control, /matchMedia.*prefers-color-scheme: dark/);
  assert.match(control, /window\.print\(\)/);
});

test("no new third-party scripts or tracking are introduced by controls", () => {
  const control = read("components/SiteDisplayControls.tsx");
  assert.doesNotMatch(control, /<Script\b|createElement\("script"\)|<iframe|fetch\(|sendBeacon\(|gtag\(/);
  assert.match(control, /window\.addEventListener\("storage"/);
  assert.match(control, /window\.dispatchEvent\(new Event\(PREFERENCE_EVENT\)\)/);
  const css = read("components/SiteDisplayControls.module.css");
  assert.match(css, /focus-visible/);
  assert.match(css, /min-height: 2\.75rem/);
  assert.match(css, /@media print/);
});

test("Next's shared footer retains one back-to-top control; avoid duplicate widget injection", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  const layout = read("app/[locale]/layout.tsx");
  const footer = read("app/components/Footer.tsx");
  assert.doesNotMatch(page, /<Script\s+src="\/site-widgets\.js"|src="\/theme-toggle\.js"/);
  assert.match(layout, /<ThemeBootstrap\s*\/>/);
  assert.match(footer, /<BackToTopButton/);
  assert.match(footer, /<SiteDisplayControls/);
  assert.doesNotMatch(page, /data-home-back-to-top/);
  assert.doesNotMatch(read("components/home/LegacyFooterSection.tsx"), /href="#main-content"/);
});
