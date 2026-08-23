import assert from "node:assert/strict";
import test from "node:test";

import {
  extractHtmlFragment,
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

test("removeLegacyElementsById removes sections replaced by native React", () => {
  const fragment = `<section id="keep"><p>Keep</p></section><section id="migrated"><p>Legacy</p></section>`;

  assert.equal(
    removeLegacyElementsById(fragment, ["migrated"]),
    `<section id="keep"><p>Keep</p></section>`,
  );
});
