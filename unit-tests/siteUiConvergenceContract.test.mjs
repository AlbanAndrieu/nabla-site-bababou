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


test("legacy people footer and native Next print share button hierarchy and geometry", () => {
  const people = read("public/people-contacted.html");
  const legacyCSS = read("public/theme.css");
  const nativeCSS = read("components/ui/Action.module.css");
  const controlsCSS = read("components/SiteDisplayControls.module.css");
  const controls = read("components/SiteDisplayControls.tsx");
  assert.match(people, /<nav class="legacy-footer-actions" aria-label="Footer navigation">/);
  assert.match(people, /legacy-footer-action--primary/);
  assert.match(people, /legacy-footer-action--secondary/);
  assert.doesNotMatch(people, /btn btn-sm btn-outline-secondary/);
  assert.match(legacyCSS, /\.footer \.legacy-footer-action\s*\{/);
  assert.match(legacyCSS, /min-width:\s*13\.75rem/);
  assert.match(legacyCSS, /min-height:\s*2\.75rem/);
  assert.match(nativeCSS, /min-width:\s*var\(--ui-action-min-width\)/);
  assert.match(nativeCSS, /min-height:\s*var\(--ui-control-min-height\)/);
  assert.match(controls, /data-site-print-control/);
  assert.match(controls, /aria-label="Print \/ Save as PDF"/);
  assert.match(controls, /<svg[\s\S]*?aria-hidden="true"/);
  assert.match(controlsCSS, /\.print\s*\{[^}]*position:\s*fixed/);
  assert.match(controlsCSS, /\.print\s*\{[^}]*bottom:\s*calc\(20px/);
  assert.match(controlsCSS, /\.print\s*\{[^}]*right:\s*calc\(20px/);
  assert.match(controlsCSS, /@media \(max-width: 575\.98px\)[\s\S]*?\.print\s*\{[^}]*border-radius:\s*50%/);
  assert.match(controlsCSS, /@media print[\s\S]*?\.controls\s*\{[^}]*display:\s*none/);
});
