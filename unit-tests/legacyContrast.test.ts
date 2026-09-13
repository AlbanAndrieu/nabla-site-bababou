import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readProjectFile = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy theme bootstrap owns the post-Bootstrap contrast layer", async () => {
  const [themeToggle, contrastCss] = await Promise.all([
    readProjectFile("public/theme-toggle.js"),
    readProjectFile("public/legacy-contrast.css"),
  ]);

  assert.match(themeToggle, /legacy-contrast\.css/);
  assert.match(themeToggle, /ensureLegacyContrastStyles\(\)/);
  assert.match(themeToggle, /data-nabla-legacy-contrast|nablaLegacyContrast/);
  assert.match(contrastCss, /\.page-dark \.bg-light/);
  assert.match(contrastCss, /\.page-dark \.bg-white/);
  assert.match(contrastCss, /\.page-dark \.text-muted/);
  assert.match(contrastCss, /color: var\(--text-primary[^;]+!important;/);
  assert.match(contrastCss, /--legacy-contrast-muted: #526174/);
  assert.match(contrastCss, /--legacy-contrast-muted: #a8b0bd/);
});

test("representative legacy contrast regressions keep using the compatibility boundary", async () => {
  const [people, centralAuthorities] = await Promise.all([
    readProjectFile("public/people-contacted.html"),
    readProjectFile("public/central-authorities.html"),
  ]);

  for (const html of [people, centralAuthorities]) {
    assert.match(html, /class="page-dark"/);
    assert.match(html, /theme-toggle\.js/);
    assert.match(html, /bg-light/);
  }

  assert.match(people, /class="text-light"/);
  assert.match(people, /class="card-text text-muted/);
});
