import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isHomeCutoverEnabled } from "../lib/homeCutoverPolicy.mjs";
import { auditHomepageCutover, HOME_LOCALES } from "../scripts/verify-home-cutover.mjs";

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
  assert.match(home, /localizedSiteMetadata\(locale\)/);
  assert.match(home, /\{c\.intro\}/);
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
  assert.match(root, /<ChildHomeSections locale=\{locale\} \/>/);
  assert.match(read("app/[locale]/abduction/page.tsx"), /<AbductionResources locale=\{locale\} \/>/);
  assert.match(read("components/RouteHeader.tsx"), /hasMainContentRoute\(parts\) \|\| parts\.length === 0/);
  assert.match(read("components/RouteHeader.tsx"), /!showNavigation && !showLanguageSwitcher && !hasMainContent/);
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

test("approved homepage is generated statically for all four locales before release", () => {
  assert.deepEqual([...HOME_LOCALES], ["fr", "en", "de", "no"]);
  const publicHome = read("app/[locale]/page.tsx");
  assert.match(publicHome, /export const dynamic = "force-static"/);
  assert.match(publicHome, /isHomeCutoverEnabled\(\)/);
  const routes = Object.fromEntries(
    ["/", "/en", "/de", "/no"].map(route =>
      [route, { initialRevalidateSeconds: false }]),
  );
  const result = auditHomepageCutover({ routes }, ready);
  assert.equal(result.passed, true);
  assert.equal(result.status, "STATIC_BUILD_VERIFIED");
  assert.equal(result.checked.length, 4);
});

test("editorial approval does not bypass SHA or browser verification", () => {
  const routes = Object.fromEntries(
    ["/", "/en", "/de", "/no"].map(route =>
      [route, { initialRevalidateSeconds: false }]),
  );
  for (const env of [
    {},
    { ...ready, BABABOU_HOME_BROWSER_GATES_APPROVED: "false" },
    { ...ready, VERCEL_GIT_COMMIT_SHA: "c".repeat(40) },
    { ...ready, BABABOU_HOME_CUTOVER_SHA: "xyz" },
  ]) {
    const denied = auditHomepageCutover({ routes }, env);
    assert.equal(denied.passed, false);
    assert.equal(denied.status, "APPROVAL_INCOMPLETE");
  }
  const missing = structuredClone(routes);
  delete missing["/de"];
  assert.deepEqual(auditHomepageCutover({ routes: missing }, ready).missing, ["de"]);
  const dynamic = structuredClone(routes);
  dynamic["/en"].initialRevalidateSeconds = 30;
  assert.deepEqual(auditHomepageCutover({ routes: dynamic }, ready).notStatic, ["/en"]);
  assert.equal(auditHomepageCutover(null, ready).status, "MANIFEST_MISSING");
  const malformed = { ...routes, "/en": undefined };
  assert.deepEqual(auditHomepageCutover({ routes: malformed }, ready).notStatic, ["/en"]);
  assert.equal(auditHomepageCutover({ routes: malformed }, ready).passed, false);
});

test("legacy index gets conditional noindex only after SHA-approved homepage release", () => {
  const config = read("next.config.mjs");
  assert.match(config, /isHomeCutoverEnabled\(\) \? \[\{/);
  assert.match(config, /source: "\/index\.html"/);
  assert.match(config, /value: "noindex, follow"/);
  assert.match(config, /env changes require redeploy/);
});

test("local release recipe verifies static build before demanding browser checks", () => {
  const recipes = read("justfile");
  const e2e = read("tests/homepage-cutover.spec.ts");
  assert.match(recipes, /home-cutover-verify:/);
  assert.match(recipes, /node scripts\/verify-home-cutover\.mjs/);
  assert.match(recipes, /BABABOU_HOME_REQUIRE_E2E=true/);
  assert.match(recipes, /playwright test tests\/homepage-cutover\.spec\.ts/);
  assert.match(e2e, /required homepage release E2E cannot silently skip/);
});
