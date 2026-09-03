import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("payment result routes are native localized noindex surfaces", async () => {
  const [success, cancel] = await Promise.all([
    read("app/[locale]/success/page.tsx"),
    read("app/[locale]/cancel/page.tsx"),
  ]);

  for (const source of [success, cancel]) {
    assert.match(source, /NON_INDEXABLE_ROBOTS/);
    assert.match(source, /localizedPageMetadata/);
    assert.match(source, /CheckoutResultCard/);
    assert.doesNotMatch(source, /payment\.html/);
    assert.doesNotMatch(source, /checkout\.html/);
    assert.doesNotMatch(source, /alban(?:d)?rieu\.com/i);
  }

  assert.match(success, /slice\(0, 200\)/);
  assert.doesNotMatch(success, /dangerouslySetInnerHTML/);
});

test("checkout messages are loaded as a first-class i18n domain", async () => {
  const messages = await read("i18n/messages.ts");
  assert.match(messages, /CHECKOUT_LOADERS/);
  assert.match(messages, /messages\/checkout\/fr\.json/);
  assert.match(messages, /messages\/checkout\/en\.json/);
  assert.match(messages, /messages\/checkout\/de\.json/);
  assert.match(messages, /messages\/checkout\/no\.json/);
});
