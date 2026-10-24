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

test("the approved homepage remains on the static fallback", () => {
  const proxy = read("proxy.ts");
  const page = read("app/[locale]/home-preview/page.tsx");
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.match(page, /process\.env\.HOMEPAGE_PREVIEW_ENABLED === "true"/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
});
