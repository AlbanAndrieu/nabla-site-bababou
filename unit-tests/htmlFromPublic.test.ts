import assert from "node:assert/strict";
import test from "node:test";

import {
  extractHtmlFragment,
  loadPublicHtmlFragment,
} from "../lib/htmlFromPublic.ts";

test("extractHtmlFragment keeps the reviewed body content and removes a legacy footer", () => {
  const html = `<!doctype html><html><body><main><p>Hello</p></main><footer>Legacy footer</footer></body></html>`;
  const fragment = extractHtmlFragment(html, "body");

  assert.match(fragment, /<main><p>Hello<\/p><\/main>/);
  assert.doesNotMatch(fragment, /Legacy footer/);
});

test("loadPublicHtmlFragment keeps the protected custom 404 source available", async () => {
  const fragment = await loadPublicHtmlFragment("404.html", "body", "en");

  assert.ok(fragment.trim().length > 0);
  assert.match(fragment, /<h1>404<\/h1>/i);
  assert.match(fragment, /Back to home/i);
});

test("loadPublicHtmlFragment rejects retired bridge sources", async () => {
  for (const file of [
    "test.html",
    "policy/privacy_policy.html",
    "policy/cookie_policy.html",
    "index.html",
  ]) {
    await assert.rejects(
      loadPublicHtmlFragment(file, "body", "en"),
      /not allowed for loadPublicHtmlFragment/,
    );
  }
});
