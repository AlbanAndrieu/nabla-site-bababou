import assert from "node:assert/strict";
import test from "node:test";

import {
  extractHtmlFragment,
  loadPublicHtmlFragment,
  removeLegacyElementsById,
  rewriteLegacyHtmlHrefs,
} from "../lib/htmlFromPublic.ts";
import { POLICY_PAGES, POLICY_PAGE_SLUGS } from "../lib/policyPages.ts";

const LOCALIZED_PREFIXES = {
  fr: "",
  en: "/en",
  de: "/de",
  no: "/no",
} as const;

test("extractHtmlFragment keeps body content and removes the legacy footer", () => {
  const html = `<!doctype html><html><body><main><p>Hello</p></main><footer>Legacy footer</footer></body></html>`;
  const fragment = extractHtmlFragment(html, "body");
  assert.match(fragment, /<main><p>Hello<\/p><\/main>/);
  assert.doesNotMatch(fragment, /Legacy footer/);
});

test("rewriteLegacyHtmlHrefs emits clean localized Next.js routes", () => {
  const fragment = `<a href="contact.html?from=legacy#form">Contact</a><img src="./assets/photo.webp">`;

  for (const [locale, prefix] of Object.entries(LOCALIZED_PREFIXES)) {
    assert.equal(
      rewriteLegacyHtmlHrefs(fragment, locale),
      `<a href="${prefix}/contact?from=legacy#form">Contact</a><img src="/assets/photo.webp">`,
    );
  }
});

test("rewriteLegacyHtmlHrefs resolves policy links from their source directory", () => {
  const fragment = `<a href="privacy_policy.html?from=cookies#rights">Privacy</a><a href="../index.html">Home</a>`;

  for (const [locale, prefix] of Object.entries(LOCALIZED_PREFIXES)) {
    assert.equal(
      rewriteLegacyHtmlHrefs(fragment, locale, "policy/cookie_policy.html"),
      `<a href="${prefix}/policy/privacy_policy?from=cookies#rights">Privacy</a><a href="/">Home</a>`,
    );
  }
});

test("legacy index links keep the owner-controlled homepage canonical", () => {
  const fragment = `<a href="../index.html">Home</a>`;

  for (const locale of Object.keys(LOCALIZED_PREFIXES)) {
    assert.equal(rewriteLegacyHtmlHrefs(fragment, locale), `<a href="/">Home</a>`);
  }
});

test("removeLegacyElementsById removes sections replaced by native React", () => {
  const fragment = `<section id="keep"><p>Keep</p></section><section id="migrated"><p>Legacy</p></section>`;
  assert.equal(
    removeLegacyElementsById(fragment, ["migrated"]),
    `<section id="keep"><p>Keep</p></section>`,
  );
});

test("loadPublicHtmlFragment uses the explicit fallback for untranslated files", async () => {
  for (const locale of ["en", "de", "no"] as const) {
    const fragment = await loadPublicHtmlFragment("404.html", "body", locale);
    assert.ok(fragment.trim().length > 0);
    assert.match(fragment, /<h1>404<\/h1>/i);
    assert.match(fragment, /Back to home/i);
  }
});

for (const slug of POLICY_PAGE_SLUGS) {
  test(`${slug} is an explicit Next fragment source`, async () => {
    const policy = POLICY_PAGES[slug];
    const fragment = await loadPublicHtmlFragment(
      policy.sourceFile,
      "main",
      "en",
    );

    assert.ok(fragment.includes(`<h1>${policy.heading}</h1>`));
    assert.doesNotMatch(fragment, /<footer\b/i);
    assert.doesNotMatch(
      fragment,
      /href=["'](?:\/|\.\.?\/)[^"']*\.html(?:[?#][^"']*)?["']/i,
      "internal legacy HTML links should be rewritten to clean Next routes",
    );
  });
}

test("policy cross-links stay inside each localized policy namespace", async () => {
  for (const locale of ["en", "de", "no"] as const) {
    const prefix = LOCALIZED_PREFIXES[locale];
    const cookie = await loadPublicHtmlFragment(
      POLICY_PAGES.cookie_policy.sourceFile,
      "main",
      locale,
    );
    assert.match(
      cookie,
      new RegExp(`href="${prefix}/policy/privacy_policy"`),
    );
    assert.doesNotMatch(
      cookie,
      new RegExp(`href="${prefix}/privacy_policy"`),
    );

    const impressum = await loadPublicHtmlFragment(
      POLICY_PAGES.impressum.sourceFile,
      "main",
      locale,
    );
    assert.match(
      impressum,
      new RegExp(`href="${prefix}/policy/privacy_policy"`),
    );
    assert.match(
      impressum,
      new RegExp(`href="${prefix}/policy/service_terms"`),
    );

    const legal = await loadPublicHtmlFragment(
      POLICY_PAGES.legal.sourceFile,
      "main",
      locale,
    );
    assert.match(
      legal,
      new RegExp(`href="${prefix}/policy/privacy_policy"`),
    );
    assert.match(
      legal,
      new RegExp(`href="${prefix}/policy/service_terms"`),
    );
  }
});

test("loadPublicHtmlFragment rejects files outside the explicit allowlist", async () => {
  await assert.rejects(
    loadPublicHtmlFragment("index.html", "body", "fr"),
    /not allowed for loadPublicHtmlFragment/,
  );
});
