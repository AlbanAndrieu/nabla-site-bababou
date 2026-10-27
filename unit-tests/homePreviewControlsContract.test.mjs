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

test("native theme chooser floats in the upper-right and header clears it", () => {
  const css = read("components/SiteDisplayControls.module.css");
  const header = read("components/RouteHeader.module.css");
  const nre = read("app/[locale]/nre/page.tsx");
  const layout = read("app/[locale]/layout.tsx");
  assert.match(css, /\.theme\s*\{[^}]*position:\s*fixed/);
  assert.match(css, /\.theme\s*\{[^}]*top:\s*calc\(1rem \+ env\(safe-area-inset-top/);
  assert.match(css, /\.theme\s*\{[^}]*right:\s*calc\(1rem \+ env\(safe-area-inset-right/);
  assert.match(css, /\.theme\s*\{[^}]*z-index:\s*1050/);
  assert.match(css, /\.theme \.button span:last-child/);
  assert.match(css, /@media print[\s\S]*\.controls\s*\{[\s\S]*display:\s*none/);
  assert.match(header, /padding-inline-end:\s*clamp\(20rem/);
  assert.match(header, /@media \(max-width: 900px\)[\s\S]*padding-block-start:\s*calc\(4\.5rem/);
  assert.match(layout, /<Footer/);
  assert.doesNotMatch(nre, /<SiteDisplayControls/);
});

test("Next theme selector matches the legacy homepage rounded segmented control", () => {
  const native = read("components/SiteDisplayControls.module.css");
  const legacy = read("public/theme.css");
  const component = read("components/SiteDisplayControls.tsx");
  assert.match(legacy, /\.theme-toggle__track\s*\{[\s\S]*?border-radius:\s*50rem/);
  assert.match(legacy, /\.theme-toggle__btn\s*\{[\s\S]*?border-radius:\s*50rem/);
  assert.match(native, /\.theme\s*\{[\s\S]*?border-radius:\s*50rem/);
  assert.match(native, /\.theme\s+\.button\s*\{[\s\S]*?border-radius:\s*50rem/);
  for (const token of ["--toggle-track-bg", "--toggle-border", "--toggle-bg", "--toggle-text", "--toggle-segment-muted"]) {
    assert.ok(native.includes(token), token);
  }
  assert.match(native, /\.theme\s+\.button\[aria-pressed="true"\]/);
  assert.match(native, /@media \(max-width: 575\.98px\)[\s\S]*?border-radius:\s*50%/);
  assert.match(native, /width:\s*var\(--ui-control-min-height/);
  assert.match(native, /height:\s*var\(--ui-control-min-height/);
  assert.match(component, /title=\{label\}/);
  assert.match(component, /aria-pressed=\{preference === value\}/);
});

test("storage failures use tab-only memory to keep selected theme and aria in sync", () => {
  const control = read("components/SiteDisplayControls.tsx");
  assert.match(control, /let volatilePreference: ThemePreference \| null = null;/);
  assert.match(control, /if \(volatilePreference !== null\) return volatilePreference;/);
  assert.match(control, /volatilePreference = null;/);
  assert.match(control, /volatilePreference = value;/);
  assert.match(control, /window\.dispatchEvent\(new Event\(PREFERENCE_EVENT\)\)/);
  assert.match(control, /aria-pressed=\{preference === value\}/);
});
