import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("the safe React gallery retains the original ten-card layout", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  const gallery = read("components/home/LegacyStoryGallerySection.tsx");
  assert.match(page, /<LegacyStoryGallerySection \/>/);
  const titles = [...gallery.matchAll(/    title: "([^"]+)",/g)].map((match) => match[1]);
  assert.equal(titles.length, 10);
  assert.equal(new Set(titles).size, 10);
  assert.match(gallery, /cards\.map\(\(card\) =>/);
  assert.match(gallery, /grid/);
  assert.match(gallery, /Looking for Norwegian Translator/);
  assert.match(gallery, /Looking for German Translator/);
  assert.match(read("components/home/LegacyJourneySection.tsx"), /France, Norway and Germany/);
  assert.match(read("components/home/LegacyFamilyFactsSection.tsx"), /Important Information You Should Know/);
});

test("all gallery images are existing public assets, excluding identity and location proof", () => {
  const gallery = read("components/home/LegacyStoryGallerySection.tsx");
  const images = [...gallery.matchAll(/    image: "(\/assets\/[^"]+)",/g)].map((match) => match[1]);
  assert.ok(images.length >= 4);
  for (const image of images) {
    assert.ok(existsSync(new URL("../public" + image, import.meta.url)), image);
    assert.doesNotMatch(image, /passport|location|identity|child-abuse/i);
  }
});

test("the visual layout is responsive and does not depend on third-party JavaScript", () => {
  const gallery = read("components/home/LegacyStoryGallerySection.tsx");
  const styles = read("components/home/LegacyStoryGallerySection.module.css");
  assert.doesNotMatch(gallery, /<Script\b|<iframe|sendBeacon|fetch\(|dangerouslySetInnerHTML/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 60rem\)/);
  assert.match(styles, /@media \(max-width: 40rem\)/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("new React blocks do not duplicate historical sensitive identifiers", () => {
  const sources = [
    "components/home/LegacyStoryGallerySection.tsx",
    "components/home/LegacyFamilyFactsSection.tsx",
    "components/home/LegacyJourneySection.tsx",
  ];
  for (const path of sources) {
    const value = read(path);
    assert.doesNotMatch(value, /\b14CV\d{5}\b|tortberg\.kanvas|goo\.gl\/maps|passport-fr-bababou/i);
    assert.doesNotMatch(value, /she changed your|kept prisoner|escape justice/i);
  }
});
