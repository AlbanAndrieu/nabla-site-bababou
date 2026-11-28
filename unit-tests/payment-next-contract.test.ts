import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectUrl = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFile(projectUrl(path), "utf8");

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

  // The session reference is read client-side so the route stays static.
  assert.match(success, /CheckoutSessionReference/);
  assert.match(
    await read("components/CheckoutSessionReference.tsx"),
    /slice\(0, 200\)/,
  );
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

test("legacy payment result artifacts stay removed after Next parity", async () => {
  await assert.rejects(access(projectUrl("public/success.html")));
  await assert.rejects(access(projectUrl("public/cancel.html")));

  const stylelint = await read("stylelint.config.cjs");
  assert.doesNotMatch(stylelint, /public\/checkout\.css/);
});
