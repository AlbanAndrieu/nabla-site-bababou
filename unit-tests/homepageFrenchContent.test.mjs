import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { HOME_GALLERY_CARDS } from "../lib/homeGalleryCatalog.mjs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("French is the native homepage rendering, not a Google Translate redirect", () => {
  for (const pagePath of [
    "app/[locale]/home-preview/page.tsx",
    "app/[locale]/page.tsx",
  ]) {
    const page = read(pagePath);
    assert.match(page, /locale === "fr" \? \(/);
    assert.match(page, /<FrenchHomeSections \/>/);
    assert.match(page, /import FrenchHomeSections from "@\/components\/home\/FrenchHomeSections"/);
    assert.match(page, /<LegacyOpeningSection \/>/);
    assert.match(page, /<LegacyFooterSection locale=\{locale\} \/>/);
    assert.doesNotMatch(page, /<Script[^>]*google|translate\.google/i);
  }
  const layout = read("app/[locale]/layout.tsx");
  assert.match(layout, /<html lang=\{locale\}/);
});

test("French body has twelve native sections and the translated shared policy section", () => {
  const body = read("components/home/FrenchHomeSections.tsx");
  const explicitIds = [...body.matchAll(/<section id="(preview-[a-z-]+)"/g)].map((match) => match[1]);
  assert.equal(explicitIds.length, 11);
  assert.equal(new Set(explicitIds).size, explicitIds.length);
  assert.match(body, /<LegacyAssociationsSection locale="fr" \/>/);
  for (const id of [
    "preview-opening", "preview-important-information", "preview-contact",
    "preview-letter", "preview-found-website", "preview-about",
    "preview-journey", "preview-legal-resources", "preview-story-gallery",
    "preview-people", "preview-document-disclosure",
  ]) assert.ok(explicitIds.includes(id), id);
  for (const heading of [
    "Ma chère fille,", "Comment me contacter", "Un message de ton papa",
    "France, Norvège et Allemagne", "Cadre juridique et ressources",
    "Personnes que j’ai contactées", "Documents publiés sur ce site",
  ]) assert.ok(body.includes(heading), heading);
  assert.doesNotMatch(body, /<section[^>]*lang="en"/);
  const footer = read("components/home/LegacyFooterSection.tsx");
  assert.match(footer, /locale === "fr"/);
  assert.match(footer, /Mentions et politiques du site/);
});

test("French gallery preserves the exact ten reviewed images and destinations", () => {
  const body = read("components/home/FrenchHomeSections.tsx");
  assert.equal((body.match(/\btitle: "/g) ?? []).length, 10);
  assert.equal((body.match(/\bdescription: "/g) ?? []).length, 10);
  assert.equal((body.match(/\blink: "/g) ?? []).length, 10);
  assert.equal(HOME_GALLERY_CARDS.length, 10);
  assert.match(body, /HOME_GALLERY_CARDS\.map\(\(card, index\) =>/);
  assert.match(body, /<GalleryCardMedia image=\{card\.image\} \/>/);
  assert.match(body, /href=\{card\.href\}/);
  assert.match(body, /Recherche de traduction en norvégien/);
  assert.match(body, /Recherche de traduction en allemand/);
  assert.doesNotMatch(body, /passport-fr-bababou|child-abuse\.jpg|goo\.gl\/maps|14CV[0-9]+/i);
});

test("French version retains all public link targets and accessible landmarks", () => {
  const french = read("components/home/FrenchHomeSections.tsx");
  const preview = read("app/[locale]/home-preview/page.tsx");
  const gallery = HOME_GALLERY_CARDS.map(({ href }) => href);
  const targets = new Set(
    [...french.matchAll(/\bid="(preview-[a-z-]+)"/g)].map((match) => "#" + match[1]),
  );
  assert.equal(targets.size, 20);
  for (const href of gallery) assert.ok(targets.has(href), href);
  for (const href of ["#preview-contact", "#preview-journey", "#preview-story-gallery"]) {
    assert.ok(preview.includes(`href="${href}"`), href);
  }
  for (const href of [
    "mailto:aa@bababou.com", "/people-contacted.html",
    "/for-fathers.html", "/central-authorities.html",
  ]) assert.ok(french.includes(href), href);
  assert.match(french, /<details className=\{disclosureStyles\.details\}>/);
  assert.match(french, /lang="fr"/);
});
