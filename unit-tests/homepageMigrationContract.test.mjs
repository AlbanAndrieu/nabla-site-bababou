import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { homeAudienceCopy } from "../lib/homeAudienceCopy.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const locales = ["fr", "en", "de", "no"];

test("homepage preview translation catalogs remain complete", () => {
  const catalogs = locales.map((locale) =>
    JSON.parse(read(`messages/homepage-preview/${locale}.json`)).homepagePreview
  );
  const keys = Object.keys(catalogs[0]).sort();
  for (const [i, catalog] of catalogs.entries()) {
    assert.deepEqual(Object.keys(catalog).sort(), keys, locales[i]);
    assert.ok(Object.values(catalog).every((value) => typeof value === "string" && value.trim().length > 0));
  }
});

test("React homepage is review-only and the production cutover remains fail-closed", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const root = read("app/[locale]/page.tsx");
  const proxy = read("proxy.ts");
  assert.match(preview, /robots: \{ index: false, follow: false \}/);
  assert.match(preview, /alternates: \{ canonical: "\/" \}/);
  assert.match(root, /isHomeCutoverEnabled\(\)/);
  assert.match(root, /redirect\("\/"\)/);
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.ok(existsSync(new URL("../public/index.html", import.meta.url)));
});

test("all audiences preserve shared accessible layout and in-page navigation", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const fathers = read("app/[locale]/abduction/page.tsx");
  const header = read("components/RouteHeader.tsx");
  for (const s of [preview, fathers]) {
    assert.match(s, /<main id="main-content" tabIndex=\{-1\}/);
    assert.match(s, /data-home-section-nav|aria-label=\{c\.resourcesTitle\}/);
    assert.match(s, /<LegacyFooterSection locale=\{locale\} \/>/);
  }
  assert.match(header, /<a className="skip-to-main" href="#main-content">/);
  assert.match(read("app/[locale]/home-preview/page.module.css"), /:focus-visible/);
});

test("approved English messages remain in the archive for parity, not in the new child page", () => {
  const legacy = read("public/index.html");
  const opening = read("components/home/LegacyOpeningSection.tsx");
  const message = read("components/home/LegacyMessageSection.tsx");
  assert.match(legacy, /My Dear Daughter/);
  assert.match(opening, /My Dear Daughter/);
  assert.match(message, /A Message from Your Papa/);
  const childPage = read("app/[locale]/home-preview/page.tsx");
  assert.doesNotMatch(childPage, /<LegacyOpeningSection|<LegacyMessageSection/);
  assert.match(childPage, /<ChildHomeSections locale=\{locale\} \/>/);
});

test("homepage content remains about Éléonore and references only child-safe cards", () => {
  const section = read("components/home/ChildHomeSections.tsx");
  for (const id of ["preview-opening","preview-letter","preview-hope","preview-identity","preview-contact","preview-story-gallery"]) {
    assert.ok(section.includes(`id="${id}"`), id);
  }
  assert.match(section, /mailto:aa@bababou\.com/);
  assert.doesNotMatch(section, /id="preview-people"/);
  assert.match(read("lib/homeAudienceCopy.mjs"), /"\/people-contacted\.html"/);
  assert.doesNotMatch(section, /14CV[0-9]+|passport/i);
});

test("parent resources, translators, legal links and document notice are separate", () => {
  const section = read("components/home/AbductionResources.tsx");
  for (const id of ["child-abduction","parent-contact","translators","parent-resources","documents-notice","abduction-cards"]) {
    assert.ok(section.includes(`id="${id}"`), id);
  }
  assert.match(section, /LegacyAssociationsSection locale=\{locale\}/);
  assert.match(section, /canonicalPagePath\("nre", locale\)/);
  assert.match(section, /<details className=\{disclosureStyles\.details\}>/);
});

test("all four languages have child letters, patient hope and father support", () => {
  for (const locale of locales) {
    const { child, fathers } = homeAudienceCopy(locale);
    assert.equal(child.letter.length, 3);
    assert.equal(child.cards.length, 5);
    assert.equal(fathers.cards.length, 6);
    assert.ok(child.hopeText.length >= 35);
    assert.ok(fathers.abductionText.length >= 70);
  }
});
