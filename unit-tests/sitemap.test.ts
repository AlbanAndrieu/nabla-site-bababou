import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap.ts";

test("sitemap preserves active legacy URLs and adds native Next surfaces", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.length > 4);
  assert.ok(urls.includes("https://bababou.com/"));
  assert.ok(urls.includes("https://bababou.com/contact"));
  assert.ok(urls.includes("https://bababou.com/link"));
  assert.ok(urls.includes("https://bababou.com/email"));
});

test("sitemap replaces migrated legacy duplicates with native Next URLs", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.equal(urls.includes("https://bababou.com/index.html"), false);
  assert.equal(urls.includes("https://bababou.com/contact.html"), false);
  assert.equal(urls.includes("https://bababou.com/email.html"), false);
  assert.equal(urls.includes("https://bababou.com/link.html"), false);
});

test("native sitemap entries derive locale alternates from routing", async () => {
  const entries = await sitemap();
  const contact = entries.find(
    (entry) => entry.url === "https://bababou.com/contact",
  );

  assert.ok(contact);
  assert.deepEqual(contact.alternates?.languages, {
    fr: "https://bababou.com/contact",
    en: "https://bababou.com/en/contact",
    "x-default": "https://bababou.com/contact",
  });
});
