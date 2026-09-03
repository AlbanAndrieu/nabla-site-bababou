import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DOMAINS = ["site", "contact", "email", "link", "checkout"] as const;
const LOCALES = ["fr", "en", "de", "no"] as const;

function keyShape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(keyShape);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, keyShape(nested)]),
    );
  }
  return typeof value;
}

for (const domain of DOMAINS) {
  test(`${domain} first-class locale catalogs keep the same message shape`, async () => {
    const catalogs = await Promise.all(
      LOCALES.map(async (locale) => {
        const source = await readFile(
          new URL(`../messages/${domain}/${locale}.json`, import.meta.url),
          "utf8",
        );
        return [locale, keyShape(JSON.parse(source))] as const;
      }),
    );

    const englishShape = catalogs.find(([locale]) => locale === "en")?.[1];
    assert.ok(englishShape);

    for (const [locale, catalogShape] of catalogs) {
      assert.deepEqual(
        catalogShape,
        englishShape,
        `${domain}/${locale}.json drifted`,
      );
    }
  });
}
