import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isHomePreviewPath } from "../lib/homePreviewSeoPolicy.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("public React review is visible without runtime env opt-in, while / remains legacy", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const proxy = read("proxy.ts");
  assert.doesNotMatch(preview, /HOMEPAGE_PREVIEW_ENABLED|previewEnabled\(/);
  assert.match(preview, /export default async function HomePreview/);
  assert.match(preview, /robots: \{ index: false, follow: false \}/);
  assert.match(preview, /alternates: \{ canonical: "\/" \}/);
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.match(proxy, /pathname === "\/fr\/home-preview"/);
  assert.match(proxy, /new URL\("\/home-preview", request\.url\), 307/);
});

test("review route has explicit noindex and no-store response headers", () => {
  const config = read("next.config.mjs");
  assert.match(config, /"\/home-preview"/);
  assert.match(config, /"\/:locale\/home-preview"/);
  assert.match(config, /"X-Robots-Tag", value: "noindex, nofollow, nosnippet"/);
  assert.match(config, /"Cache-Control", value: "private, no-store"/);
});

test("the ten-card gallery preserves translator calls without republishing sensitive details", () => {
  const page = read("app/[locale]/home-preview/page.tsx");
  const cards = read("lib/homeGalleryCatalog.mjs");
  assert.match(page, /<LegacyStoryGallerySection \/>/);
  assert.match(cards, /Looking for Norwegian Translator/);
  assert.match(cards, /Looking for German Translator/);
  assert.match(cards, /href: "#preview-contact"/);
  assert.doesNotMatch(cards, /14CV|Francfort|passport|Norwegian authorities|German authorities/i);
  assert.doesNotMatch(cards, /fetch\(|sendBeacon\(|<Script|<iframe/i);
});

test("review-only locale routes and aliases are excluded from legacy sitemap import", () => {
  for (const path of [
    "/home-preview", "/home-preview/", "/fr/home-preview",
    "/en/home-preview", "/de/home-preview", "/no/home-preview",
    "/no/home-preview/",
  ]) {
    assert.equal(isHomePreviewPath(path), true, path);
  }
  for (const path of [
    "/", "/contact", "/fr/contact", "/home-preview-old",
    "/preview/home-preview", "/en/home-preview/other", "/home-preview.jpg",
  ]) {
    assert.equal(isHomePreviewPath(path), false, path);
  }
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /isHomePreviewPath\(url\.pathname\)/);
});
