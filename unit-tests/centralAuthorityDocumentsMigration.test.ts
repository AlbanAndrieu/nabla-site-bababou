import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import sitemap from "../app/sitemap.ts";

test("central authority archive hub is a native Next surface", async () => {
  const page = await readFile(
    new URL("../app/[locale]/central-authorities-documents/page.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/[locale]/central-authorities-documents/page.module.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /listCentralAuthorityDocuments/);
  assert.match(page, /localizedPageMetadata/);
  assert.doesNotMatch(page, /bootstrap/i);
  assert.doesNotMatch(page, /legacy-contrast\.css/);
  assert.match(styles, /var\(--ui-surface\)/);
  assert.match(styles, /var\(--ui-text-primary\)/);
});

test("legacy ca hub redirects to its English native successor", async () => {
  const config = await readFile(new URL("../next.config.mjs", import.meta.url), "utf8");

  assert.match(config, /source: "\/ca"/);
  assert.match(config, /source: "\/ca\/index\.html"/);
  assert.match(config, /destination: "\/en\/central-authorities-documents"/);
});

test("sitemap replaces the legacy ca hub with localized native canonicals", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);
  const native = entries.find(
    (entry) => entry.url === "https://bababou.com/central-authorities-documents",
  );

  assert.equal(urls.includes("https://bababou.com/ca/index.html"), false);
  assert.ok(native);
  assert.deepEqual(native.alternates?.languages, {
    fr: "https://bababou.com/central-authorities-documents",
    en: "https://bababou.com/en/central-authorities-documents",
    de: "https://bababou.com/de/central-authorities-documents",
    no: "https://bababou.com/no/central-authorities-documents",
    "x-default": "https://bababou.com/central-authorities-documents",
  });
});
