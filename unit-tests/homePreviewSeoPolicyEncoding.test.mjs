import assert from "node:assert/strict";
import test from "node:test";
import { isHomePreviewPath } from "../lib/homePreviewSeoPolicy.mjs";

test("sitemap excludes homepage review in all four locale routes", () => {
  for (const pathname of [
    "/home-preview",
    "/home-preview/",
    "/fr/home-preview",
    "/en/home-preview",
    "/de/home-preview",
    "/no/home-preview",
  ]) {
    assert.equal(isHomePreviewPath(pathname), true, pathname);
  }
});

test("repeatedly percent-encoded and upper-case review aliases are excluded", () => {
  for (const pathname of [
    "/en/%68ome-preview",
    "/en/%2568ome-preview",
    "/en/%252568ome-preview",
    "/%2568ome-preview",
    "/NO/HOME-PREVIEW",
    "/%65n%2Fhome-preview",
  ]) {
    assert.equal(isHomePreviewPath(pathname), true, pathname);
  }
});

test("ordinary public paths are not classified as homepage review", () => {
  for (const pathname of [
    "/",
    "/en/nre",
    "/home-preview-other",
    "/en/home-preview/extra",
    "/other/home-preview",
    "/en/invalid%XX",
    "",
    null,
    undefined,
  ]) {
    assert.equal(isHomePreviewPath(pathname), false, String(pathname));
  }
});
