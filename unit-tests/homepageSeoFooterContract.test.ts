import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("P1/P3/P4 do not advertise phantom localized homepage URLs", async () => {
  const [catalog, metadata, homepage] = await Promise.all([
    read("lib/sitePageCatalog.ts"),
    read("lib/siteSocialMetadata.ts"),
    read("app/[locale]/page.tsx"),
  ]);
  assert.match(catalog, /if \(slug === "index"\) return "\/"/);
  assert.match(metadata, /canonicalPagePath\("index", locale\)/);
  assert.doesNotMatch(metadata, /localizedHomePath/);
  // Until the SHA-bound cutover, alternates stay a single canonical "/".
  assert.match(
    metadata,
    /alternates: released\s*\?\s*releasedHomepageAlternates\(locale\)\s*:\s*\{ canonical \}/,
  );
  assert.match(homepage, /redirect\("\/"\)/);
});

test("P2 footer navigation name follows the active locale", async () => {
  const [footer, layout, french, english] = await Promise.all([
    read("app/components/Footer.tsx"),
    read("app/[locale]/layout.tsx"),
    read("messages/fr.json"),
    read("messages/en.json"),
  ]);
  assert.match(footer, /aria-label=\{navigationAriaLabel\}/);
  assert.match(footer, /screenReaderOnly/);
  assert.doesNotMatch(footer, /href="\/(?:eleonore-)?feed\.xml"/);
  assert.match(layout, /navigationAriaLabel=\{site\.footerNavigationAria\}/);
  for (const [locale, content] of [
    ["fr", french],
    ["en", english],
  ]) {
    const value = JSON.parse(content).site.footerNavigationAria;
    assert.equal(typeof value, "string", locale + " footer landmark missing");
    assert.ok(
      value.length > 4,
      locale + " footer landmark must be descriptive",
    );
  }
});

test("localized home release links do not force readers back to French", async () => {
  const [footer, policySection, policyPaths] = await Promise.all([
    read("app/components/Footer.tsx"),
    read("components/home/LegacyFooterSection.tsx"),
    read("lib/policyRoutePaths.ts"),
  ]);
  assert.match(footer, /isHomeCutoverEnabled\(\)/);
  assert.match(footer, /releasedHomepagePath\(locale\)/);
  assert.match(policySection, /localizedPolicyPath\(slug, locale\)/);
  for (const p of [
    "app/[locale]/page.tsx",
    "app/[locale]/home-preview/page.tsx",
  ]) {
    const page = await read(p);
    assert.doesNotMatch(
      page,
      /<LegacyFooterSection|id="preview-resources"|href="\/feed\.xml"/,
    );
  }
  assert.match(footer, /href="\/policy\/legal"/);

  assert.match(policyPaths, /locale === routing\.defaultLocale/);
});
