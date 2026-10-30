import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isHomeCutoverEnabled } from "../lib/homeCutoverPolicy.mjs";

const sha = "a".repeat(40);
const ready = {
  BABABOU_HOME_CUTOVER: "approved",
  BABABOU_HOME_EDITORIAL_APPROVED: "true",
  BABABOU_HOME_BROWSER_GATES_APPROVED: "true",
  BABABOU_HOME_CUTOVER_SHA: sha,
  VERCEL_GIT_COMMIT_SHA: sha,
};
const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("public homepage cutover is disabled by default and on incomplete authorization", () => {
  assert.equal(isHomeCutoverEnabled({}), false);
  for (const field of Object.keys(ready)) {
    const missing = { ...ready };
    delete missing[field];
    assert.equal(isHomeCutoverEnabled(missing), false, field);
  }
  assert.equal(isHomeCutoverEnabled({ ...ready, BABABOU_HOME_CUTOVER: "true" }), false);
  assert.equal(isHomeCutoverEnabled({ ...ready, BABABOU_HOME_CUTOVER_SHA: "f".repeat(40) }), false);
  assert.equal(isHomeCutoverEnabled({ ...ready, BABABOU_HOME_CUTOVER_SHA: sha.slice(0, 8) }), false);
  assert.equal(isHomeCutoverEnabled({ ...ready, BABABOU_HOME_CUTOVER_SHA: "A".repeat(40) }), false);
  assert.equal(isHomeCutoverEnabled({ ...ready, BABABOU_HOME_EDITORIAL_APPROVED: "false" }), false);
  assert.equal(isHomeCutoverEnabled({ ...ready, BABABOU_HOME_BROWSER_GATES_APPROVED: "false" }), false);
});

test("cutover accepts only the explicitly reviewed deployment SHA", () => {
  assert.equal(isHomeCutoverEnabled(ready), true);
  assert.equal(isHomeCutoverEnabled({ ...ready, VERCEL_GIT_COMMIT_SHA: "b".repeat(40) }), false);
});

test("legacy root is preserved until the cutover gate is true", () => {
  const proxy = read("proxy.ts");
  const home = read("app/[locale]/page.tsx");
  const preview = read("app/[locale]/home-preview/page.tsx");
  assert.match(proxy, /pathname === "\/" && !isHomeCutoverEnabled\(\)/);
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.match(proxy, /localeRootRedirects\.has\(request\.nextUrl\.pathname\) && !isHomeCutoverEnabled\(\)/);
  assert.match(home, /if \(!isHomeCutoverEnabled\(\)\) redirect\("\/"\)/);
  assert.match(home, /return localizedSiteMetadata\(locale\)/);
  assert.match(home, /\{t\("publicIntro"\)\}/);
  assert.doesNotMatch(home, /\{t\("note"\)\}/);
  assert.doesNotMatch(home, /href="\/"[\s\S]*?\{t\("legacy"\)\}/);
  assert.match(preview, /robots: \{ index: false, follow: false \}/);
  assert.match(preview, /\{t\("note"\)\}/);
});

test("public homepage copy is complete for all locales without third-party widgets", () => {
  const locales = ["fr", "en", "de", "no"];
  for (const locale of locales) {
    const { homepagePreview } = JSON.parse(read(`messages/homepage-preview/${locale}.json`));
    assert.ok(homepagePreview.publicIntro.length > 20, locale);
  }
  const root = read("app/[locale]/page.tsx");
  assert.doesNotMatch(root, /<iframe|<Script\b|fetch\(|sendBeacon\(/);
  assert.match(root, /<LegacyStoryGallerySection \/>/);
  assert.match(root, /<LegacyDisclosureSection \/>/);
  assert.match(read("components/RouteHeader.tsx"), /hasMainContentRoute\(parts\) \|\| parts\.length === 0/);
});

test("released SEO URLs stay separate from the legacy and browser route catalog", () => {
  const catalog = read("lib/sitePageCatalog.ts");
  const meta = read("lib/siteSocialMetadata.ts");
  const sitemap = read("app/sitemap.ts");
  assert.match(catalog, /if \(slug === "index"\) return "\/"/);
  assert.match(catalog, /export function releasedHomepagePath\(locale: AppLocale\)/);
  assert.match(catalog, /return locale === routing\.defaultLocale \? "\/" : `\/\$\{locale\}`/);
  assert.doesNotMatch(catalog, /import \{ isHomeCutoverEnabled \}/);
  assert.match(meta, /releasedHomepagePath\(locale\)/);
  assert.match(meta, /releasedHomepageAlternates\(locale\)/);
  assert.match(sitemap, /releasedHomepagePath\(locale\)/);
  assert.match(sitemap, /isHomeCutoverEnabled\(\) \? \[releasedHomepageSitemapEntry\(\)\]/);
});
