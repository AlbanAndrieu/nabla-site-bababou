import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { HOME_GALLERY_CARDS } from "../lib/homeGalleryCatalog.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("the safe React gallery retains the original ten-card layout", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  const gallery = read("components/home/LegacyStoryGallerySection.tsx");
  assert.match(page, /<LegacyStoryGallerySection \/>/);
  const titles = HOME_GALLERY_CARDS.map(({ title }) => title);
  assert.equal(titles.length, 10);
  assert.equal(new Set(titles).size, 10);
  assert.match(gallery, /HOME_GALLERY_CARDS\.map\(\(card\) =>/);
  assert.match(gallery, /grid/);
  assert.ok(titles.includes("Looking for Norwegian Translator"));
  assert.ok(titles.includes("Looking for German Translator"));
  assert.match(read("components/home/LegacyJourneySection.tsx"), /France, Norway and Germany/);
  assert.match(read("components/home/LegacyFamilyFactsSection.tsx"), /Important Information You Should Know/);
  const about = read("components/home/LegacySiteAboutSection.tsx");
  assert.match(about, /<details>/);
  assert.match(about, /https:\/\/calendly\.com\/alban-andrieu/);
  assert.match(about, /https:\/\/ko-fi\.com\/albandrieu/);
  assert.match(about, /rel="noopener noreferrer"/);
});

test("all ten gallery cards use existing local artwork, excluding identity and location proof", () => {
  const gallery = read("components/home/LegacyStoryGallerySection.tsx");
  const images = HOME_GALLERY_CARDS.map(({ image }) => image).filter(Boolean);
  assert.equal(images.length, 10);
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
    "lib/homeGalleryCatalog.mjs",
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

test("each gallery card has a safe local fragment and readable link text", () => {
  for (const card of HOME_GALLERY_CARDS) {
    assert.match(card.href, /^#preview-[a-z-]+$/);
    for (const field of [card.title, card.description, card.link]) {
      assert.ok(typeof field === "string" && field.trim().length > 0);
    }
  }
});


test("gallery images have an accessible, network-free rendering fallback", () => {
  const gallery = read("components/home/LegacyStoryGallerySection.tsx");
  const media = read("components/home/GalleryCardMedia.tsx");
  assert.match(gallery, /<GalleryCardMedia image=\{card\.image\} \/>/);
  assert.match(media, /"use client"/);
  assert.match(media, /useState\(false\)/);
  assert.match(media, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(media, /data-gallery-media-fallback/);
  assert.match(media, /aria-hidden="true"/);
  assert.doesNotMatch(media, /fetch\(|sendBeacon\(|setTimeout\(/);
});

test("new gallery illustrations are local, static and free of remote references", () => {
  const expected = [
    "/assets/home-card-contact.svg",
    "/assets/home-card-documents.svg",
    "/assets/home-card-people.svg",
    "/assets/home-card-message.svg",
  ];
  for (const filename of expected) {
    assert.ok(HOME_GALLERY_CARDS.some(({ image }) => image === filename), filename);
    const svg = read("public" + filename);
    assert.match(svg, /^<svg xmlns="http:\/\/www\\.w3\\.org\/2000\/svg"/);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|<image\b|\b(?:xlink:)?href=/i);
    assert.doesNotMatch(svg, /(?:<text\b|<metadata\b)/i);
  }
});
