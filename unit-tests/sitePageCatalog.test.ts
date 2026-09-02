import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalPagePath,
  isNextCanonicalSlug,
  isSeoPageSlug,
  pageAlternates,
  SEO_PAGE_SLUGS,
} from "../lib/sitePageCatalog.ts";

test("hybrid homepage stays single-canonical at the legacy root", () => {
  for (const locale of ["fr", "en", "de", "no"] as const) {
    assert.equal(canonicalPagePath("index", locale), "/");
  }
  assert.equal(isNextCanonicalSlug("index"), false);
  assert.equal(isSeoPageSlug("index"), false);
});

test("native Next routes use the French default locale without a prefix", () => {
  assert.equal(canonicalPagePath("contact", "fr"), "/contact");
  assert.equal(canonicalPagePath("email", "fr"), "/email");
  assert.equal(canonicalPagePath("link", "fr"), "/link");
});

test("native Next routes prefix non-default locales and stay extensionless", () => {
  for (const locale of ["en", "de", "no"] as const) {
    assert.equal(canonicalPagePath("contact", locale), `/${locale}/contact`);
    assert.equal(canonicalPagePath("email", locale), `/${locale}/email`);
    assert.equal(canonicalPagePath("link", locale), `/${locale}/link`);
  }
});

test("legacy URL semantics remain frozen until the route is migrated", () => {
  assert.equal(isNextCanonicalSlug("security"), false);
  assert.equal(canonicalPagePath("security", "en"), "/security.html");
  assert.equal(canonicalPagePath("security", "fr"), "/fr/security.html");
  assert.equal(canonicalPagePath("security", "de"), "/security.html");
  assert.equal(canonicalPagePath("security", "no"), "/security.html");
});

test("alternates follow routing locales and use French as x-default", () => {
  assert.deepEqual(pageAlternates("contact", "de"), {
    canonical: "/de/contact",
    languages: {
      fr: "/contact",
      en: "/en/contact",
      de: "/de/contact",
      no: "/no/contact",
      "x-default": "/contact",
    },
  });
});

test("the Next sitemap indexes only stable localized Next surfaces", () => {
  assert.deepEqual(SEO_PAGE_SLUGS, ["contact", "link", "email"]);
  assert.equal(isSeoPageSlug("expertise"), false);
  assert.equal(isSeoPageSlug("security"), false);
  assert.equal(isSeoPageSlug("truenas"), false);
  assert.equal(isSeoPageSlug("cv"), false);
  assert.equal(isSeoPageSlug("jm"), false);
});
