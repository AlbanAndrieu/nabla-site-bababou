import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contact route preserves public professional parity", async () => {
  const page = await readFile(
    new URL("../app/[locale]/contact/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /PageProps<"\/\[locale\]\/contact">/);
  assert.match(page, /pageAlternates\("contact", locale\)/);
  assert.match(page, /<ContactHero/);
  assert.match(page, /methods\.phone/);
  assert.match(page, /calendly\.com\/alban-andrieu/);
  assert.match(page, /openstreetmap\.org/);
  assert.match(page, /\/cv\/cv-/);
});

test("contact hero renders the public professional identity and CV CTA", async () => {
  const hero = await readFile(
    new URL("../components/ContactHero.tsx", import.meta.url),
    "utf8",
  );

  assert.match(hero, /contactHref: string/);
  assert.match(hero, /cvHref: string/);
  assert.match(hero, /experience: string/);
  assert.match(hero, /role: string/);
  assert.match(hero, /profileAlt: string/);
  assert.match(hero, /Alban Andrieu/);
});

test("contact catalogs retain intentional public professional contact data", async () => {
  const catalogs = await Promise.all(
    ["en", "fr"].map((locale) =>
      readFile(
        new URL(`../messages/contact/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ),
  );

  for (const catalog of catalogs) {
    assert.match(catalog, /job@albandrieu\.com/);
    assert.match(catalog, /"phone"\s*:/i);
    assert.match(catalog, /Alban Andrieu/);
    assert.doesNotMatch(catalog, /"coordinates"\s*:/i);
  }
});
