import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("the legacy NRE destination remains available from the Next homepage review", () => {
  const legacy = read("public/index.html");
  const legal = read("components/home/LegacyLegalResourcesSection.tsx");
  const redirects = read("next.config.mjs");
  assert.match(legacy, /href="nre-en\.html"/);
  assert.match(legal, /canonicalPagePath\("nre", locale\)/);
  assert.match(redirects, /source: "\/nre-en\.html", destination: "\/en\/nre"/);
  assert.ok(existsSync(new URL("../app/[locale]/nre/page.tsx", import.meta.url)));
  assert.ok(existsSync(new URL("../public/nre-en.html", import.meta.url)));
});

test("public legal resources use the existing routes without copying case records", () => {
  const legal = read("components/home/LegacyLegalResourcesSection.tsx");
  const css = read("components/home/LegacyLegalResourcesSection.module.css");
  assert.match(legal, /href: "\/for-fathers\.html"/);
  assert.match(legal, /canonicalPagePath\("central-authorities", locale\)/);
  assert.match(legal, /id="preview-legal-resources"/);
  assert.match(legal, /resources\.map\(/);
  assert.match(legal, /resourcesFor\(locale\)/);
  assert.match(legal, /locale: AppLocale/);
  assert.match(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 40rem\)/);
  assert.ok(existsSync(new URL("../public/for-fathers.html", import.meta.url)));
  assert.ok(existsSync(new URL("../app/[locale]/central-authorities/page.tsx", import.meta.url)));
  assert.doesNotMatch(legal, /passport|officialIdentifier|currentLocation|personalRecord|tortberg|14CV/i);
});

test("gallery images are direct local assets and retain a no-network fallback", () => {
  const media = read("components/home/GalleryCardMedia.tsx");
  const gallery = read("lib/homeGalleryCatalog.mjs");
  assert.match(media, /\bunoptimized\b/);
  assert.match(media, /onError=\{\(\) => setFailed\(true\)\}/);
  assert.match(media, /data-gallery-media-fallback/);
  assert.doesNotMatch(media, /fetch\(|sendBeacon\(|https?:\/\//);
  assert.doesNotMatch(gallery, /image: null/);
  assert.equal((gallery.match(/image: "\/assets\//g) ?? []).length, 10);
});

test("legal resource links use the canonical locale-aware route registry", () => {
  const sitePages = read("lib/sitePageCatalog.ts");
  const routing = read("i18n/routing.ts");
  const page = read("app/[locale]/home-preview/page.tsx");
  const legal = read("components/home/LegacyLegalResourcesSection.tsx");
  assert.match(routing, /locales: \["fr", "en", "de", "no"\]/);
  assert.match(sitePages, /locale === routing\.defaultLocale \? "" : `\/\$\{locale\}`/);
  assert.match(sitePages, /return `\$\{prefix\}\/\$\{slug\}`/);
  assert.match(page, /<LegacyLegalResourcesSection locale=\{locale\} \/>/);
  assert.match(legal, /canonicalPagePath\("nre", locale\)/);
  assert.match(legal, /canonicalPagePath\("central-authorities", locale\)/);
  assert.doesNotMatch(legal, /href: "\/en\/(?:nre|central-authorities)"/);
});
