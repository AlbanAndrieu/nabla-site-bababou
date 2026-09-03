import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  canonicalPagePath,
  isNextCanonicalSlug,
  isSeoPageSlug,
  pageAlternates,
  SEO_PAGE_SLUGS,
  SITE_PAGES,
} from "../lib/sitePageCatalog.ts";

const RETIRED_GHOST_ROUTES = [
  "pricing",
  "payment",
  "startup",
  "startup-thanks",
  "checkout",
  "checkout-tjm",
  "login",
  "ai",
  "security",
  "expertise",
  "ciso",
  "truenas",
  "ctid",
  "freenas",
  "nabla",
  "workstation",
  "cv",
  "jm",
] as const;

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

test("retired ghost routes stay out of the public page catalog", () => {
  for (const slug of RETIRED_GHOST_ROUTES) {
    assert.equal(slug in SITE_PAGES, false, `${slug} must stay retired`);
    assert.equal(isSeoPageSlug(slug), false);
  }
});

test("obsolete ghost-route generators stay removed", async () => {
  for (const path of [
    "../lib/htmlRoutes.config.mjs",
    "../scripts/old/generate_fr_locale_html.py",
  ]) {
    await assert.rejects(access(new URL(path, import.meta.url)));
  }
});

test("retired ghost-route styles stay removed", async () => {
  const layouts = await readFile(
    new URL("../public/page-layouts.css", import.meta.url),
    "utf8",
  );

  for (const selector of [
    "page-security",
    "page-ciso",
    "page-login",
    "page-ctid",
  ]) {
    assert.doesNotMatch(layouts, new RegExp(`\\.${selector}\\b`));
  }
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
});
