import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isHomePreviewPath } from "../lib/homePreviewSeoPolicy.mjs";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("public React review is visible without runtime env opt-in, while / remains legacy", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const proxy = read("proxy.ts");
  assert.doesNotMatch(preview, /HOMEPAGE_PREVIEW_ENABLED|previewEnabled\(/);
  assert.match(preview, /export default async function HomePreview/);
  assert.match(preview, /robots: \{ index: false, follow: false \}/);
  assert.match(preview, /alternates: \{ canonical: "\/" \}/);
  assert.match(proxy, /NextResponse\.rewrite\(new URL\("\/index\.html"/);
  assert.match(proxy, /pathname === "\/fr\/home-preview"/);
  // Regression: next-intl's internal /fr rewrite must not hit the user redirect (307 loop).
  assert.match(
    proxy,
    /pathname === "\/fr\/home-preview" && !request\.headers\.has\("x-next-intl-locale"\)/,
  );
  assert.match(proxy, /new URL\("\/home-preview", request\.url\), 307/);
});

test("review route has explicit noindex and no-store response headers", async () => {
  const { default: nextConfig } = await import("../next.config.mjs");
  const headers = await nextConfig.headers();
  for (const source of ["/home-preview", "/:locale/home-preview"]) {
    const rule = headers.find((h) => h.source === source);
    assert.ok(rule, source);
    assert.deepEqual(rule.headers, [
      { key: "X-Robots-Tag", value: "noindex, nofollow, nosnippet" },
      { key: "Cache-Control", value: "private, no-store" },
    ]);
  }
});

test("personal cards and parent translator resources are split without leaking private data", () => {
  const home = read("app/[locale]/home-preview/page.tsx");
  const fathers = read("app/[locale]/abduction/page.tsx");
  const child = read("components/home/ChildHomeSections.tsx");
  const copy = read("lib/homeAudienceCopy.mjs");
  assert.match(home, /<ChildHomeSections locale=\{locale\} \/>/);
  assert.match(fathers, /<AbductionResources locale=\{locale\} \/>/);
  assert.match(child, /homeAudienceCards\(locale, "child"\)/);
  assert.match(copy, /"\/people-contacted\.html"/);
  assert.match(copy, /norwegianTitle/);
  assert.match(copy, /germanTitle/);
  assert.doesNotMatch(copy, /14CV[0-9]+|passport-fr-bababou|currentLocation/i);
});

test("review-only locale routes and aliases are excluded from legacy sitemap import", () => {
  for (const path of [
    "/home-preview",
    "/home-preview/",
    "/fr/home-preview",
    "/en/home-preview",
    "/de/home-preview",
    "/no/home-preview",
    "/no/home-preview/",
    "/%68ome-preview",
    "/en/%68ome-preview",
    "/en%2Fhome-preview",
    "/de/home-preview%2F",
  ]) {
    assert.equal(isHomePreviewPath(path), true, path);
  }
  for (const path of [
    "/",
    "/contact",
    "/fr/contact",
    "/home-preview-old",
    "/preview/home-preview",
    "/en/home-preview/other",
    "/home-preview.jpg",
    "/%ZZome-preview",
    "/en%2Fcontact",
  ]) {
    assert.equal(isHomePreviewPath(path), false, path);
  }
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /isHomePreviewPath\(url\.pathname\)/);
});
