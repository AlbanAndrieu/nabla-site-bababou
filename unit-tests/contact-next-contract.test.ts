import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PROFESSIONAL_OR_PRECISE_PATTERNS = [
  /DevSecOps/i,
  /Calendly/i,
  /nabla-site-alban/i,
  /PostalAddress/i,
  /openstreetmap\.org/i,
  /methods\.phone/i,
  /\/cv\//i,
];

test("contact route uses shared Next routing and accessibility primitives", async () => {
  const page = await readFile(
    new URL("../app/[locale]/contact/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /PageProps<"\/\[locale\]\/contact">/);
  assert.match(page, /pageAlternates\("contact", locale\)/);
  assert.match(page, /<SkipToMainContent \/>/);
  assert.match(page, /<TopAnchor \/>/);

  for (const pattern of PROFESSIONAL_OR_PRECISE_PATTERNS) {
    assert.doesNotMatch(page, pattern);
  }
});

test("contact hero owns and renders its localized copy", async () => {
  const hero = await readFile(
    new URL("../components/ContactHero.tsx", import.meta.url),
    "utf8",
  );

  assert.match(hero, /getTranslations\("contactPage\.hero"\)/);
  for (const key of ["profileAlt", "title", "subtitle", "intro", "contactCta"]) {
    assert.match(hero, new RegExp(`t\\("${key}"\\)`));
  }
  assert.match(hero, /contactHref: string/);
  assert.doesNotMatch(hero, /cvHref|experience: string|role: string|profileAlt: string/);
});

test("contact catalogs expose no private phone or precise-address fields", async () => {
  const catalogs = await Promise.all(
    ["en", "fr"].map((locale) =>
      readFile(
        new URL(`../messages/contact/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ),
  );

  for (const catalog of catalogs) {
    assert.doesNotMatch(catalog, /"phone"\s*:/i);
    assert.doesNotMatch(catalog, /"streetAddress"\s*:/i);
    assert.doesNotMatch(catalog, /"postalCode"\s*:/i);
    assert.doesNotMatch(catalog, /"coordinates"\s*:/i);
  }
});
