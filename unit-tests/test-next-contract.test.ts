import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFile(projectUrl(path), "utf8");

test("Next test surface is localized and remains non-indexable", async () => {
  const [page, messages] = await Promise.all([
    read("app/[locale]/test/page.tsx"),
    read("i18n/messages.ts"),
  ]);

  assert.match(page, /getTranslations/);
  assert.match(page, /setRequestLocale/);
  assert.match(page, /namespace: "testSurface"/);
  assert.match(page, /getTranslations\("testSurface"\)/);
  assert.match(page, /NON_INDEXABLE_ROBOTS/);
  assert.doesNotMatch(page, />OSINT framework test surface</);
  assert.match(messages, /TEST_LOADERS/);

  for (const locale of ["fr", "en", "de", "no"]) {
    const catalog = JSON.parse(
      await read(`messages/test/${locale}.json`),
    ) as Record<string, unknown>;
    assert.deepEqual(Object.keys(catalog), ["testSurface"]);
  }
});

test("legacy test HTML stays published until ARF and sensitive-corpus parity is proven", async () => {
  await access(projectUrl("public/test.html"));

  const [legacy, nextConfig, catalog] = await Promise.all([
    read("public/test.html"),
    read("next.config.mjs"),
    read("lib/sitePageCatalog.ts"),
  ]);

  for (const requiredLegacySignal of [
    "d3.v3.min.js",
    "arf.js",
    "index.js",
    "association-section",
  ]) {
    assert.ok(legacy.includes(requiredLegacySignal));
  }

  assert.doesNotMatch(nextConfig, /source:\s*[`"']\/test\.html/);

  const canonicalBlock = catalog.match(
    /const nextCanonicalSlugs = new Set<SitePageSlug>\(\[([\s\S]*?)\]\);/,
  );
  assert.ok(canonicalBlock);
  assert.doesNotMatch(canonicalBlock[1], /"test"/);
});
