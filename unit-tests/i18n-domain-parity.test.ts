import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DOMAINS = ["site", "contact", "email", "link"] as const;

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
  test(`${domain} French and English catalogs keep the same message shape`, async () => {
    const [englishSource, frenchSource] = await Promise.all([
      readFile(new URL(`../messages/${domain}/en.json`, import.meta.url), "utf8"),
      readFile(new URL(`../messages/${domain}/fr.json`, import.meta.url), "utf8"),
    ]);

    assert.deepEqual(
      keyShape(JSON.parse(frenchSource)),
      keyShape(JSON.parse(englishSource)),
    );
  });
}
