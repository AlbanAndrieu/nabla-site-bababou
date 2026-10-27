import assert from "node:assert/strict";
import test from "node:test";

import sitemap, { normalizeLegacyLocation, shippedLegacyPublicFile } from "../app/sitemap.ts";
import { POLICY_PAGE_SLUGS } from "../lib/policyPages.ts";

test("sitemap preserves active legacy URLs and adds native Next surfaces", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);

  assert.ok(urls.length > 4);
  assert.ok(urls.includes("https://bababou.com/"));
  assert.ok(urls.includes("https://bababou.com/contact"));
  assert.ok(urls.includes("https://bababou.com/central-authorities"));
  assert.ok(urls.includes("https://bababou.com/central-authorities-failures"));
  assert.ok(urls.includes("https://bababou.com/nre"));
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
    urls.includes("https://bababou.com/central-authorities.html"),
    false,
  );
  assert.equal(
    urls.includes("https://bababou.com/central-authorities-failures.html"),
    false,
  );
  assert.equal(urls.includes("https://bababou.com/nre-fr.html"), false);
  assert.equal(urls.includes("https://bababou.com/nre-en.html"), false);
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
  const contact = entries.find(
    (entry) => entry.url === "https://bababou.com/contact",
  );
  assert.ok(contact);
  assert.deepEqual(contact.alternates?.languages, {
    fr: "https://bababou.com/contact",
    en: "https://bababou.com/en/contact",
    de: "https://bababou.com/de/contact",
    no: "https://bababou.com/no/contact",
    "x-default": "https://bababou.com/contact",
  });

  const centralAuthorities = entries.find(
    (entry) => entry.url === "https://bababou.com/central-authorities",
  );
  assert.ok(centralAuthorities);
  assert.deepEqual(centralAuthorities.alternates?.languages, {
    fr: "https://bababou.com/central-authorities",
    en: "https://bababou.com/en/central-authorities",
    de: "https://bababou.com/de/central-authorities",
    no: "https://bababou.com/no/central-authorities",
    "x-default": "https://bababou.com/central-authorities",
  });

  const failures = entries.find(
    (entry) => entry.url === "https://bababou.com/central-authorities-failures",
  );
  assert.ok(failures);
  assert.deepEqual(failures.alternates?.languages, {
    fr: "https://bababou.com/central-authorities-failures",
    en: "https://bababou.com/en/central-authorities-failures",
    de: "https://bababou.com/de/central-authorities-failures",
    no: "https://bababou.com/no/central-authorities-failures",
    "x-default": "https://bababou.com/central-authorities-failures",
  });

  const nre = entries.find((entry) => entry.url === "https://bababou.com/nre");
  assert.ok(nre);
  assert.deepEqual(nre.alternates?.languages, {
    fr: "https://bababou.com/nre",
    en: "https://bababou.com/en/nre",
    de: "https://bababou.com/de/nre",
    no: "https://bababou.com/no/nre",
    "x-default": "https://bababou.com/nre",
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

test("legacy sitemap URLs stay canonical and same-origin", () => {
  assert.equal(
    normalizeLegacyLocation(
      "https://bababou.com/legacy.html?utm_source=test#section",
    ),
    "https://bababou.com/legacy.html",
  );
  assert.equal(
    normalizeLegacyLocation("https://bababou.com/index.html?ref=feed"),
    "https://bababou.com/",
  );
  assert.equal(
    normalizeLegacyLocation("https://bababou.com/contact.html?ref=feed"),
    null,
  );
  assert.equal(
    normalizeLegacyLocation("https://example.com/legacy.html"),
    null,
  );
  assert.equal(
    normalizeLegacyLocation("https://user:password@bababou.com/legacy.html"),
    null,
  );
  assert.equal(normalizeLegacyLocation("not a valid URL"), null);
});

test("SEO pages have unique canonical URLs and complete same-origin hreflang", async () => {
  const entries = await sitemap();
  const urls = entries.map((entry) => entry.url);
  assert.equal(new Set(urls).size, urls.length);

  for (const entry of entries.filter((item) => item.alternates?.languages)) {
    const languages = entry.alternates?.languages;
    assert.ok(languages);
    const canonical = new URL(entry.url);
    assert.equal(canonical.origin, "https://bababou.com");
    assert.equal(languages["x-default"], entry.url);
    for (const locale of ["fr", "en", "de", "no"] as const) {
      const alternate = languages[locale];
      assert.ok(alternate, `Missing ${locale} alternate for ${entry.url}`);
      const parsed = new URL(alternate);
      assert.equal(parsed.origin, canonical.origin);
      assert.equal(parsed.search, "");
      assert.equal(parsed.hash, "");
    }
  }
});


test("legacy sitemap does not publish files absent from the public artifact tree", async () => {
  const { readFileSync, statSync } = await import("node:fs");
  const { resolve, sep } = await import("node:path");
  const root = resolve(process.cwd(), "public");
  const source = readFileSync(resolve(root, "sitemap.xml"), "utf8");
  const imported = [...source.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const published = new Set((await sitemap()).map((entry) => entry.url));

  for (const location of imported) {
    let url: URL;
    try {
      url = new URL(location);
    } catch {
      continue;
    }
    if (url.origin !== "https://bababou.com") continue;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.split("/").includes("..")) continue;
    const filename = resolve(root, (pathname === "/" ? "/index.html" : pathname).replace(/^\/+/, ""));
    if (!filename.startsWith(root + sep)) continue;
    let shipped = false;
    try {
      shipped = statSync(filename).isFile();
    } catch {
      // A source XML entry can reference a document not yet approved/published.
    }
    if (!shipped) {
      assert.equal(published.has(location), false, "Unpublished legacy URL leaked into sitemap");
    }
  }
  assert.equal(shippedLegacyPublicFile("https://bababou.com/index.html"), true);
  assert.equal(shippedLegacyPublicFile("https://bababou.com/__not-yet-published-file__.html"), false);
  assert.equal(shippedLegacyPublicFile("https://example.com/index.html"), false);
  assert.equal(shippedLegacyPublicFile("https://bababou.com/%2e%2e/__private-file__.html"), false);
});


test("static legacy XML contains only already-shipped same-origin documents", async () => {
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const input = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");
  assert.doesNotMatch(input, /<!--[\s\S]*?<loc>/, "Sitemap comments must not expose unpublished document paths");
  const active = input.replace(/<!--[\s\S]*?-->/g, "");
  const locations = [...active.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(locations.length > 0, "Legacy sitemap source must not be empty");
  for (const location of locations) {
    assert.equal(new URL(location).origin, "https://bababou.com");
    assert.equal(shippedLegacyPublicFile(location), true, "Legacy XML must not advertise unpublished documents");
  }
});
