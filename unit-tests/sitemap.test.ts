import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap.ts";

test("sitemap exposes only the current native Next SEO surfaces", () => {
  const entries = sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.deepEqual(urls, [
    "https://bababou.com/",
    "https://bababou.com/contact",
    "https://bababou.com/link",
    "https://bababou.com/email",
  ]);
});

test("sitemap derives locale alternates from routing with French x-default", () => {
  const contact = sitemap().find(
    (entry) => entry.url === "https://bababou.com/contact",
  );

  assert.ok(contact);
  assert.deepEqual(contact.alternates?.languages, {
    fr: "https://bababou.com/contact",
    en: "https://bababou.com/en/contact",
    "x-default": "https://bababou.com/contact",
  });
});
