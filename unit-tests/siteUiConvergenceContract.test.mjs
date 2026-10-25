import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("language selection retains a named controlled navigation field", () => {
  const source = read("components/RouteHeader.tsx");
  assert.match(source, /<select\s+id="route-header-locale"\s+name="locale"\s+autoComplete="off"\s+value=\{locale\}/);
  assert.match(source, /router\.replace\(localizedPath\(nextLocale, targetParts\)\)/);
  assert.match(source, /aria-label=\{t\("switchLanguage"\)\}/);
});

test("explicit themes control native form widgets and scrollbars", () => {
  const source = read("app/design-tokens.css");
  assert.match(source, /html\[data-theme="light"\]\s*\{\s*color-scheme:\s*light;/);
  assert.match(source, /html\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;/);
  assert.match(read("components/ThemeBootstrap.tsx"), /document\.documentElement\.dataset\.theme = effective/);
});

test("the preview keeps a unique skip link before the navigation controls", () => {
  const header = read("components/RouteHeader.tsx");
  const preview = read("app/[locale]/home-preview/page.tsx");
  assert.match(header, /hasMainContentRoute\(parts\)/);
  assert.match(header, /hasMainContent \? \(/);
  assert.equal((header.match(/<a className="skip-to-main"/g) ?? []).length, 1);
  assert.ok(header.indexOf('<a className="skip-to-main"') < header.indexOf("<Container "));
  assert.doesNotMatch(preview, /<SkipToMainContent \/>/);
  assert.match(preview, /<main id="main-content"/);
});

test("the approved homepage remains on the static fallback", () => {
  const proxy = read("proxy.ts");
  const page = read("app/[locale]/home-preview/page.tsx");
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.doesNotMatch(page, /HOMEPAGE_PREVIEW_ENABLED/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
});
