import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const locales = ["fr", "en", "de", "no"];
const keys = ["section", "theme", "light", "dark", "auto", "print"];

test("the shared Next theme and print controls have localized accessible names", () => {
  const controls = read("components/SiteDisplayControls.tsx");
  assert.match(controls, /useTranslations\("site\.displayControls"\)/);
  assert.match(controls, /aria-label=\{t\("theme"\)\}/);
  assert.match(controls, /aria-label=\{t\("section"\)\}/);
  assert.match(controls, /aria-label=\{t\("print"\)\}/);
  assert.match(controls, /title=\{t\("print"\)\}/);
  assert.match(controls, /const label = t\(value\)/);
  assert.doesNotMatch(controls, /lang="en"/);
  assert.match(controls, /window\.print\(\)/);

  const sets = [];
  for (const locale of locales) {
    const messages = JSON.parse(read("messages/site/" + locale + ".json"));
    const labels = messages.site.displayControls;
    assert.deepEqual(Object.keys(labels), keys, locale);
    for (const [key, value] of Object.entries(labels)) {
      assert.equal(typeof value, "string", locale + "." + key);
      assert.ok(value.trim(), locale + "." + key + ": empty translation");
      assert.doesNotMatch(value, /<script|javascript:/i, locale + "." + key);
    }
    sets.push(labels.theme + "|" + labels.print);
  }
  assert.equal(new Set(sets).size, locales.length);
  assert.equal(JSON.parse(read("messages/site/en.json")).site.displayControls.print, "Print / Save as PDF");
});

test("translation plumbing keeps the same shared controls on every route", () => {
  const layout = read("app/[locale]/layout.tsx");
  const footer = read("app/components/Footer.tsx");
  const messages = read("i18n/messages.ts");
  assert.match(layout, /<NextIntlClientProvider locale=\{locale\} messages=\{\{ site \}\}>/);
  assert.match(footer, /<SiteDisplayControls\s*\/>/);
  assert.match(messages, /SITE_LOADERS\[locale\]\(\)/);
});
