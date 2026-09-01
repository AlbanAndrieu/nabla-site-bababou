import assert from "node:assert/strict";
import test from "node:test";

import {
  extractHtmlFragment,
  loadPublicHtmlFragment,
  removeLegacyElementsById,
  rewriteLegacyHtmlHrefs,
} from "../lib/htmlFromPublic.ts";

test("extractHtmlFragment keeps body content and removes the legacy footer", () => {
  const html = `<!doctype html><html><body><main><p>Hello</p></main><footer>Legacy footer</footer></body></html>`;
  const fragment = extractHtmlFragment(html, "body");
  assert.match(fragment, /<main><p>Hello<\/p><\/main>/);
  assert.doesNotMatch(fragment, /Legacy footer/);
});

test("rewriteLegacyHtmlHrefs emits clean localized Next.js routes", () => {
  const fragment = `<a href="contact.html?from=legacy#form">Contact</a><img src="./assets/photo.webp">`;
  assert.equal(
    rewriteLegacyHtmlHrefs(fragment, "fr"),
    `<a href="/contact?from=legacy#form">Contact</a><img src="/assets/photo.webp">`,
  );
  assert.equal(
    rewriteLegacyHtmlHrefs(fragment, "en"),
    `<a href="/en/contact?from=legacy#form">Contact</a><img src="/assets/photo.webp">`,
  );
});

test("rewriteLegacyHtmlHrefs resolves policy links from their source directory", () => {
  const fragment = `<a href="privacy_policy.html?from=cookies#rights">Privacy</a><a href="../index.html">Home</a>`;
  assert.equal(
    rewriteLegacyHtmlHrefs(fragment, "fr", "policy/cookie_policy.html"),
    `<a href="/policy/privacy_policy?from=cookies#rights">Privacy</a><a href="/">Home</a>`,
  );
  assert.equal(
    rewriteLegacyHtmlHrefs(fragment, "en", "policy/cookie_policy.html"),
    `<a href="/en/policy/privacy_policy?from=cookies#rights">Privacy</a><a href="/">Home</a>`,
  );
});

test("legacy index links keep the owner-controlled homepage canonical", () => {
  const fragment = `<a href="../index.html">Home</a>`;
  assert.equal(rewriteLegacyHtmlHrefs(fragment, "fr"), `<a href="/">Home</a>`);
  assert.equal(rewriteLegacyHtmlHrefs(fragment, "en"), `<a href="/">Home</a>`);
});

test("removeLegacyElementsById removes sections replaced by native React", () => {
  const fragment = `<section id="keep"><p>Keep</p></section><section id="migrated"><p>Legacy</p></section>`;
  assert.equal(
    removeLegacyElementsById(fragment, ["migrated"]),
    `<section id="keep"><p>Keep</p></section>`,
  );
});

test("loadPublicHtmlFragment uses the explicit default fallback for untranslated files", async () => {
  const fragment = await loadPublicHtmlFragment("404.html", "body", "en");
  assert.ok(fragment.trim().length > 0);
  assert.match(fragment, /<h1>404<\/h1>/i);
  assert.match(fragment, /Back to home/i);
});

test("accessibility policy is an explicit Next fragment source", async () => {
  const fragment = await loadPublicHtmlFragment(
    "policy/accessibility_statement.html",
    "main",
    "en",
  );
  assert.match(fragment, /<h1>Accessibility Statement<\/h1>/i);
  assert.match(fragment, /href="\/"/);
  assert.doesNotMatch(fragment, /<footer\b/i);
});

test("cookie policy is an explicit Next fragment source with clean policy links", async () => {
  const fragment = await loadPublicHtmlFragment(
    "policy/cookie_policy.html",
    "main",
    "en",
  );
  assert.match(fragment, /<h1>Cookie Policy<\/h1>/i);
  assert.match(fragment, /href="\/en\/policy\/privacy_policy"/);
  assert.doesNotMatch(fragment, /href="\/en\/privacy_policy"/);
  assert.doesNotMatch(fragment, /<footer\b/i);
});

test("loadPublicHtmlFragment rejects files outside the explicit allowlist", async () => {
  await assert.rejects(
    loadPublicHtmlFragment("index.html", "body", "fr"),
    /not allowed for loadPublicHtmlFragment/,
  );
});
