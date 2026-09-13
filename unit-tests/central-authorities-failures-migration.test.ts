import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const locales = ["fr", "en", "de", "no"] as const;

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function leafPaths(
  value: Record<string, unknown>,
  prefix = "",
): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === "object" && !Array.isArray(child)
      ? leafPaths(child as Record<string, unknown>, path)
      : [path];
  });
}

test("central authorities failures owns structurally aligned first-class locale catalogs", async () => {
  const catalogs = await Promise.all(
    locales.map(async (locale) =>
      JSON.parse(
        await readFile(
          new URL(
            `messages/central-authorities-failures/${locale}.json`,
            root,
          ),
          "utf8",
        ),
      ) as Record<string, unknown>,
    ),
  );

  const expectedPaths = leafPaths(catalogs[0]);
  assert.ok(expectedPaths.length > 30);

  for (const catalog of catalogs) {
    assert.deepEqual(Object.keys(catalog), ["centralAuthoritiesFailuresPage"]);
    assert.deepEqual(leafPaths(catalog), expectedPaths);
  }
});

test("English React copy preserves the reviewed legacy article facts and labels", async () => {
  const [legacySource, englishCatalog] = await Promise.all([
    readFile(new URL("public/central-authorities-failures.html", root), "utf8"),
    readFile(
      new URL("messages/central-authorities-failures/en.json", root),
      "utf8",
    ),
  ]);

  const legacy = normalize(legacySource);
  const catalog = JSON.parse(englishCatalog) as {
    centralAuthoritiesFailuresPage: {
      meta: { title: string; description: string };
      hero: { title: string; lead: string };
      summary: Record<string, string>;
      countries: {
        france: Record<string, string>;
        norway: Record<string, string>;
        germany: Record<string, string>;
      };
      timeline: Record<string, string>;
      readMore: Record<string, string>;
    };
  };
  const copy = catalog.centralAuthoritiesFailuresPage;

  const sourceBackedValues = [
    copy.meta.title,
    copy.meta.description,
    copy.hero.title,
    copy.hero.lead,
    ...Object.values(copy.summary),
    ...Object.values(copy.countries.france),
    ...Object.values(copy.countries.norway),
    ...Object.values(copy.countries.germany),
    ...Object.values(copy.timeline),
    ...Object.values(copy.readMore),
  ];

  for (const value of sourceBackedValues) {
    assert.ok(
      legacy.includes(normalize(value)),
      `legacy source should contain migrated English copy: ${value}`,
    );
  }
});

test("React migration is sectioned, localized and free of legacy page runtime", async () => {
  const [page, sections, config, messageLoader] = await Promise.all([
    readFile(
      new URL("app/[locale]/central-authorities-failures/page.tsx", root),
      "utf8",
    ),
    readFile(
      new URL("app/[locale]/central-authorities-failures/sections.tsx", root),
      "utf8",
    ),
    readFile(new URL("next.config.mjs", root), "utf8"),
    readFile(new URL("i18n/messages.ts", root), "utf8"),
  ]);

  assert.match(page, /getTranslations/);
  assert.match(page, /getMessages/);
  assert.match(page, /localizedPageMetadata/);
  assert.match(page, /centralAuthoritiesFailuresPage/);
  for (const section of [
    "ArticleHero",
    "FailureSummary",
    "CountryFailures",
    "FailureTimeline",
    "ReadMore",
  ]) {
    assert.match(page, new RegExp(`<${section} copy=\\{copy\\}`));
    assert.match(sections, new RegExp(`export function ${section}`));
  }

  assert.match(sections, /from "@\/components\/ui\/Badge"/);
  assert.match(sections, /from "@\/components\/ui\/Card"/);
  assert.match(sections, /from "@\/components\/ui\/ActionLink"/);
  assert.doesNotMatch(`${page}\n${sections}`, /CopyPageLinkButton|site-widgets|bootstrap/i);
  assert.doesNotMatch(`${page}\n${sections}`, /className="(?:row|col-|card|btn)/);

  assert.match(messageLoader, /CENTRAL_AUTHORITIES_FAILURES_LOADERS/);
  assert.match(
    config,
    /"central-authorities-failures"[\s\S]*destination: `\/en\/\$\{slug\}`/,
  );

  await access(new URL("public/central-authorities-failures.html", root));
  await assert.rejects(access(new URL("components/CopyPageLinkButton.tsx", root)));
});
