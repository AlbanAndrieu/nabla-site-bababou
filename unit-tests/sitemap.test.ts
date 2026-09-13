import assert from "node:assert/strict";
import test from "node:test";

import sitemap from "../app/sitemap.ts";
import { POLICY_PAGE_SLUGS } from "../lib/policyPages.ts";

test("sitemap preserves active legacy URLs and adds native Next surfaces", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.length > 4);
  assert.ok(urls.includes("https://bababou.com/"));
  assert.ok(urls.includes("https://bababou.com/contact"));
  assert.ok(urls.includes("https://bababou.com/central-authorities-failures"));
  assert.ok(urls.includes("https://bababou.com/link"));
  assert.ok(urls.includes("https://bababou.com/email"));
  assert.ok(urls.includes("https://bababou.com/policy"));
});

test("sitemap replaces migrated legacy duplicates with native Next URLs", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.equal(urls.includes("https://bababou.com/index.html"), false);
  assert.equal(urls.includes("https://bababou.com/contact.html"), false);
  assert.equal(
    urls.includes("https://bababou.com/central-authorities-failures.html"),
    false,
  );
  assert.equal(urls.includes("https://bababou.com/email.html"), false);
  assert.equal(urls.includes("https://bababou.com/link.html"), false);

  for (const policy of POLICY_PAGE_SLUGS) {
    assert.ok(
      urls.includes(`https://bababou.com/policy/${policy}`),
      `${policy} should be present under its clean canonical`,
    );
    assert.equal(
      urls.includes(`https://bababou.com/policy/${policy}.html`),
      false,
      `${policy}.html should not remain in the generated sitemap`,
    );
  }
});

test("native sitemap entries derive locale alternates from routing", async () => {
  const entries = await sitemap();
  const expected = {
    fr: "https://bababou.com/contact",
    en: "https://bababou.com/en/contact",
    de: "https://bababou.com/de/contact",
    no: "https://bababou.com/no/contact",
    "x-default": "https://bababou.com/contact",
  };
  const contact = entries.find(
    (entry) => entry.url === "https://bababou.com/contact",
  );

  assert.ok(contact);
  assert.deepEqual(contact.alternates?.languages, expected);

  const centralAuthoritiesFailures = entries.find(
    (entry) =>
      entry.url === "https://bababou.com/central-authorities-failures",
  );
  assert.ok(centralAuthoritiesFailures);
  assert.deepEqual(centralAuthoritiesFailures.alternates?.languages, {
    fr: "https://bababou.com/central-authorities-failures",
    en: "https://bababou.com/en/central-authorities-failures",
    de: "https://bababou.com/de/central-authorities-failures",
    no: "https://bababou.com/no/central-authorities-failures",
    "x-default": "https://bababou.com/central-authorities-failures",
  });
});

test("policy index publishes native hreflang alternates", async () => {
  const entries = await sitemap();
  const policyIndex = entries.find(
    (entry) => entry.url === "https://bababou.com/policy",
  );

  assert.ok(policyIndex);
  assert.deepEqual(policyIndex.alternates?.languages, {
    fr: "https://bababou.com/policy",
    en: "https://bababou.com/en/policy",
    de: "https://bababou.com/de/policy",
    no: "https://bababou.com/no/policy",
    "x-default": "https://bababou.com/policy",
  });
});

test("all policies publish native hreflang alternates", async () => {
  const entries = await sitemap();

  for (const slug of POLICY_PAGE_SLUGS) {
    const base = `https://bababou.com/policy/${slug}`;
    const entry = entries.find((candidate) => candidate.url === base);

    assert.ok(entry, `${slug} should exist in the sitemap`);
    assert.deepEqual(entry.alternates?.languages, {
      fr: base,
      en: `https://bababou.com/en/policy/${slug}`,
      de: `https://bababou.com/de/policy/${slug}`,
      no: `https://bababou.com/no/policy/${slug}`,
      "x-default": base,
    });
  }
});
