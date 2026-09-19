import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFile(projectUrl(path), "utf8");
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const homepageRasterAssets = [
  "public/assets/child-abuse.jpg",
  "public/assets/alone-1.jpg",
  "public/assets/hide-and-sick-quote.jpg",
  "public/assets/miss-and-love-you-quote.jpeg",
  "public/assets/patience-vertue-quote.jpg",
] as const;

const retiredTransparentPngs = [
  "public/assets/child-abuse.png",
  "public/assets/alone-1.png",
  "public/assets/hide-and-sick-quote.png",
  "public/assets/miss-and-love-you-quote.png",
  "public/assets/patience-vertue-quote.png",
] as const;

test("homepage uses background-preserving raster sources with a bounded payload", async () => {
  const html = await read("public/index.html");
  const totalBytes = (
    await Promise.all(
      homepageRasterAssets.map((path) => stat(projectUrl(path))),
    )
  ).reduce((sum, entry) => sum + entry.size, 0);

  assert.ok(
    totalBytes <= 160_000,
    `homepage raster budget exceeded: ${totalBytes} bytes`,
  );

  for (const path of homepageRasterAssets) {
    const filename = path.split("/").at(-1);
    assert.ok(filename);
    assert.match(
      html,
      new RegExp(`src=["']assets/${escapeRegex(filename)}["']`),
    );
  }

  for (const path of retiredTransparentPngs) {
    await assert.rejects(access(projectUrl(path)));
  }
});

test("homepage defers below-fold images and reserves raster layout space", async () => {
  const html = await read("public/index.html");
  const imageTags = html.match(/<img\b[\s\S]*?\/>/g) ?? [];

  assert.ok(imageTags.length > 0);
  for (const tag of imageTags) {
    assert.match(tag, /loading=["']lazy["']/);
    assert.match(tag, /decoding=["']async["']/);
  }

  for (const [filename, width, height] of [
    ["child-abuse.jpg", 936, 526],
    ["alone-1.jpg", 460, 215],
    ["passport-fr-bababou-4.png", 466, 263],
    ["hide-and-sick-quote.jpg", 800, 382],
    ["patience-vertue-quote.jpg", 750, 375],
    ["miss-and-love-you-quote.jpeg", 249, 203],
  ] as const) {
    const tag = imageTags.find((candidate) =>
      candidate.includes(`src="assets/${filename}"`),
    );
    assert.ok(tag, `missing homepage image ${filename}`);
    assert.match(tag, new RegExp(`width=["']${width}["']`));
    assert.match(tag, new RegExp(`height=["']${height}["']`));
  }
});

test("quote artwork keeps its paper surface while card chrome follows theme", async () => {
  const html = await read("public/index.html");
  const css = await read("public/bababou.css");

  assert.match(html, /homepage-quote-card/);
  assert.match(html, /homepage-quote-image/);
  assert.doesNotMatch(html, /homepage-quote-card[^>]*bg-white/);
  assert.match(css, /\.homepage-quote-card \.homepage-quote-image/);
  assert.match(css, /background:\s*#fff/);
  assert.match(
    css,
    /html\[data-theme="dark"\][\s\S]*\.homepage-quote-image/,
  );
});

test("social metadata and conversion tooling preserve the recovered source", async () => {
  const metadata = await read("lib/siteSocialMetadata.ts");
  const converter = await read("scripts/jpg_to_transparent_png.py");

  assert.match(metadata, /miss-and-love-you-quote\.jpeg/);
  assert.match(metadata, /type:\s*["']image\/jpeg["']/);
  assert.match(converter, /BACKGROUND_SENSITIVE_ASSETS/);
  assert.match(converter, /miss-and-love-you-quote\.jpeg/);
  assert.match(converter, /Preserve background-sensitive asset/);
});
