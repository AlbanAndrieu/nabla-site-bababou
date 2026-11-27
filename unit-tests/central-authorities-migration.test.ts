import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const locales = ["fr", "en", "de", "no"] as const;

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function leafPaths(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? leafPaths(child as Record<string, unknown>, path)
      : [path];
  });
}

test("central authorities owns structurally aligned native locale catalogs", async () => {
  const catalogs = await Promise.all(
    locales.map(
      async (locale) =>
        JSON.parse(
          await readFile(
            new URL(`messages/central-authorities/${locale}.json`, root),
            "utf8",
          ),
        ) as Record<string, unknown>,
    ),
  );

  const expectedPaths = leafPaths(catalogs[0]);
  assert.ok(expectedPaths.length > 70);

  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog), ["centralAuthoritiesPage"]);
    assert.deepEqual(leafPaths(catalog), expectedPaths);
  }
});

test("English central authorities copy remains anchored to the reviewed static source", async () => {
  const [legacySource, englishCatalog] = await Promise.all([
    readFile(new URL("public/central-authorities.html", root), "utf8"),
    readFile(new URL("messages/central-authorities/en.json", root), "utf8"),
  ]);
  const legacy = normalize(legacySource);
  const catalog = JSON.parse(englishCatalog) as {
    centralAuthoritiesPage: {
      meta: { title: string; description: string };
      hero: { title: string };
      timeline: {
        warningTitle: string;
        september2015: { date: string };
        october192015: { date: string };
        today2026: { date: string };
      };
      legal: {
        title: string;
        article3Title: string;
        interpretationTitle: string;
      };
      documents: { title: string };
      contacts: { title: string };
    };
  };
  const copy = catalog.centralAuthoritiesPage;

  for (const value of [
    copy.meta.title,
    copy.meta.description,
    copy.hero.title,
    copy.timeline.warningTitle,
    copy.timeline.september2015.date,
    copy.timeline.october192015.date,
    copy.timeline.today2026.date,
    copy.legal.title,
    copy.legal.article3Title,
    copy.legal.interpretationTitle,
    copy.documents.title,
    copy.contacts.title,
  ]) {
    assert.ok(
      legacy.includes(normalize(value)),
      `legacy source should contain migrated English copy: ${value}`,
    );
  }
});

test("central authorities React route is sectioned and keeps its static source file", async () => {
  const [page, sections, config, loader, legacy] = await Promise.all([
    readFile(
      new URL("app/[locale]/central-authorities/page.tsx", root),
      "utf8",
    ),
    readFile(
      new URL("app/[locale]/central-authorities/sections.tsx", root),
      "utf8",
    ),
    readFile(new URL("next.config.mjs", root), "utf8"),
    readFile(new URL("i18n/messages.ts", root), "utf8"),
    readFile(new URL("public/central-authorities.html", root), "utf8"),
  ]);

  for (const section of [
    "AuthoritiesHero",
    "AuthoritiesSummary",
    "AuthoritiesTimeline",
    "LegalGrounds",
    "AuthoritiesDocuments",
    "AuthoritiesContacts",
  ]) {
    assert.match(page, new RegExp(`<${section} copy=\\{copy\\}`));
    assert.match(sections, new RegExp(`export function ${section}`));
  }

  assert.match(page, /localizedPageMetadata/);
  assert.match(page, /centralAuthoritiesPage/);
  assert.match(loader, /CENTRAL_AUTHORITIES_LOADERS/);
  assert.match(config, /LEGACY_HTML_REDIRECT_SLUGS/);
  const { default: nextConfig } = await import("../next.config.mjs");
  assert.ok(
    (await nextConfig.redirects()).some(
      (r: { source: string; destination: string }) =>
        r.source === "/central-authorities.html" &&
        r.destination === "/en/central-authorities",
    ),
  );
  assert.doesNotMatch(`${page}\n${sections}`, /site-widgets|bootstrap/i);

  await access(new URL("public/central-authorities.html", root));
  await access(new URL("public/central-authorities-failures.html", root));
  assert.match(legacy, /<a name="top"><\/a>/);
  assert.match(legacy, /site-widgets\.js/);
  assert.match(legacy, /bootstrap/i);
});
