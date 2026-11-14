import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  HOME_AUDIENCE_LOCALES, homeAudienceCopy, homeAudienceCards,
  fathersAudiencePath, childAudiencePath,
} from "../lib/homeAudienceCopy.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const locales = ["fr", "en", "de", "no"];

test("both pages have native, complete content in four languages", () => {
  assert.deepEqual(Object.keys(HOME_AUDIENCE_LOCALES).sort(), [...locales].sort());
  const childKeys = Object.keys(homeAudienceCopy("fr").child).sort();
  const fathersKeys = Object.keys(homeAudienceCopy("fr").fathers).sort();
  for (const locale of locales) {
    const { child, fathers } = homeAudienceCopy(locale);
    assert.deepEqual(Object.keys(child).sort(), childKeys, locale + " child fields");
    assert.deepEqual(Object.keys(fathers).sort(), fathersKeys, locale + " fathers fields");
    for (const [name, copy] of [["child", child], ["fathers", fathers]]) {
      for (const [key, value] of Object.entries(copy)) {
        if (Array.isArray(value)) {
          assert.ok(value.length > 0, locale + " " + name + " " + key);
        } else {
          assert.ok(typeof value === "string" && value.length > 3, locale + " " + name + " " + key);
        }
      }
    }
    assert.equal(child.letter.length, 3);
    assert.equal(child.cards.length, 6);
    assert.equal(fathers.cards.length, 7);
  }
});

test("child-facing cards preserve six reviewed media and safe anchors", () => {
  const expected = ["#preview-opening", "#preview-hope", "#preview-journey", "#preview-letter", locale === "fr" ? "/people-contacted" : `/${locale}/people-contacted`, "#preview-identity"];
  for (const locale of locales) {
    const cards = homeAudienceCards(locale, "child");
    assert.deepEqual(cards.map((c) => c.href), expected);
    assert.equal(cards.length, 6);
    for (const c of cards) {
      assert.ok(c.image.startsWith("/assets/"));
      assert.ok(existsSync(new URL("../public" + c.image, import.meta.url)), c.image);
    }
  }
});

test("fathers cards retain wiki reference, contact, translation and document notice", () => {
  for (const locale of locales) {
    const cards = homeAudienceCards(locale, "fathers");
    assert.equal(cards.length, 7);
    assert.deepEqual(cards.map((c) => c.href), [
      "https://en.wikipedia.org/wiki/Child_abduction",
      "mailto:aa@bababou.com", "/for-fathers.html",
      "#translators", "#translators", "#documents-notice", "#identity-notice",
    ]);
    assert.ok(cards.every((card) => card.title && card.link));
  }
});

test("the full original Dear Daughter introduction is preserved in English and translated in FR DE NO", () => {
  const english=homeAudienceCopy("en").child;
  assert.match(english.openingTitle,/If you are reading this, your Papa is looking for you/);
  assert.match(english.opening,/Every single day since June 6, 2015/);
  assert.match(english.openingSecond,/YOU ARE NOT ALONE/);
  for(const locale of locales) {
    const child=homeAudienceCopy(locale).child;
    for(const field of ["openingTitle","opening","openingSecond"]) {
      assert.ok(child[field].length > 30, locale + ":" + field);
    }
  }
  assert.match(read("components/home/ChildHomeSections.tsx"), /<p>\{c\.openingSecond\}<\/p>/);
});

test("minor's personal identifier and location are not republished into native copy", () => {
  const data = read("lib/homeAudienceCopy.mjs");
  const child = read("components/home/ChildHomeSections.tsx");
  const fathers = read("components/home/AbductionResources.tsx");
  for (const source of [data, child, fathers]) {
    assert.doesNotMatch(source, /14CV[0-9]+|passport|passport-fr-bababou|child-abuse\.jpg|flag-norway-location|lat(?:itude)?=|longitude=/i);
  }
  for (const locale of locales) {
    const text = JSON.stringify(homeAudienceCopy(locale));
    assert.doesNotMatch(text, /14CV[0-9]+|street address|home address|kidnapper is|was kidnapped by/i);
  }
});

test("the two main React routes use the same child content, with gated public root", () => {
  const review = read("app/[locale]/home-preview/page.tsx");
  const root = read("app/[locale]/page.tsx");
  const fathers = read("app/[locale]/abduction/page.tsx");
  for (const s of [review, root]) {
    assert.match(s, /<ChildHomeSections locale=\{locale\} \/>/);
    assert.match(s, /fathersAudiencePath\(locale\)/);
    assert.doesNotMatch(s, /<LegacyStoryGallerySection|<FrenchHomeSections/);
  }
  assert.match(root, /if \(!isHomeCutoverEnabled\(\)\) redirect\("\/"\)/);
  assert.match(fathers, /<AbductionResources locale=\{locale\} \/>/);
  assert.match(fathers, /robots: \{ index: false, follow: false \}/);
  assert.match(read("next.config.mjs"), /"\/:locale\/abduction"/);
  assert.match(read("lib/mainContentRoute.mjs"), /"abduction"/);
});

test("navigational paths are locale-specific and do not rely on Google Translate", () => {
  for (const locale of locales) {
    const prefix = locale === "fr" ? "" : "/" + locale;
    assert.equal(fathersAudiencePath(locale), prefix + "/abduction");
    assert.equal(childAudiencePath(locale), prefix + "/home-preview");
  }
  for (const source of [
    read("components/home/ChildHomeSections.tsx"),
    read("components/home/AbductionResources.tsx"),
    read("app/[locale]/home-preview/page.tsx"),
  ]) assert.doesNotMatch(source, /google\.translate|<Script|<iframe/i);
});

test("people infographic and identity card have native translations and private identifiers stay redacted", () => {
  for (const locale of locales) {
    const { child } = homeAudienceCopy(locale);
    assert.equal(homeAudienceCards(locale, "child")[4].image, "/assets/people-contacted-europe.avif");
    assert.equal(homeAudienceCards(locale, "child")[5].href, "#preview-identity");
    assert.equal(homeAudienceCards(locale, "child")[4].href, locale === "fr" ? "/people-contacted" : `/${locale}/people-contacted`);
    assert.equal(child.peopleTitle, undefined);
    assert.equal(child.peopleText, undefined);
    assert.equal(child.peopleMapAlt, undefined);
    assert.equal(child.peopleMapCaption, undefined);
  }
  assert.match(read("components/home/ChildHomeSections.tsx"), /id="preview-identity"/);
  assert.doesNotMatch(read("components/home/ChildHomeSections.tsx"), /id="preview-people"/);
});
