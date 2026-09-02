import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("contact route preserves public professional parity", async () => {
  const page = await readFile(
    new URL("../app/[locale]/contact/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /PageProps<"\/\[locale\]\/contact">/);
  assert.match(page, /localizedPageMetadata\(/);
  assert.doesNotMatch(page, /pageAlternates\("contact", locale\)/);
  assert.match(page, /<ContactHero/);
  assert.match(page, /methods\.phone/);
  assert.match(page, /aa@bababou\.com/);
  assert.match(page, /calendly\.com\/alban-andrieu/);
  assert.match(page, /openstreetmap\.org/);
  assert.match(page, /\/cv\/cv-/);

  for (const removedSurface of [
    "qr_albanandrieu_contact_logo.png",
    "linkedin.com",
    "github.com",
    "twitter.com",
    "xing.com",
    "hub.docker.com",
    "stackexchange.com",
    "facebook.com",
    "instagram.com",
    "nabla-siege.slack.com",
    "discord.com",
  ]) {
    assert.doesNotMatch(page, new RegExp(removedSurface.replaceAll(".", "\\.")));
  }
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

test("contact catalogs retain only approved public professional contact data", async () => {
  const catalogs = await Promise.all(
    ["fr", "en", "de", "no"].map((locale) =>
      readFile(
        new URL(`../messages/contact/${locale}.json`, import.meta.url),
        "utf8",
      ),
    ),
  );

  for (const catalog of catalogs) {
    assert.match(catalog, /aa@bababou\.com/);
    assert.match(catalog, /\+33 6 95 43 53 53/);
    assert.match(catalog, /"district"\s*:\s*"La Défense"/);
    assert.match(catalog, /Alban Andrieu/);
    assert.doesNotMatch(catalog, /job@albandrieu\.com/);
    assert.doesNotMatch(catalog, /"social"\s*:/i);
    assert.doesNotMatch(catalog, /"opensource"\s*:/i);
    assert.doesNotMatch(catalog, /"coordinates"\s*:/i);
  }
});
