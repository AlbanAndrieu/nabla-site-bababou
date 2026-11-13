import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasMainContentRoute } from "../lib/mainContentRoute.mjs";

const root = new URL("../", import.meta.url);
const pages = [
  ["cancel", ["cancel"]],
  ["central-authorities-documents", ["central-authorities-documents"]],
  ["central-authorities-failures", ["central-authorities-failures"]],
  ["central-authorities", ["central-authorities"]],
  ["contact", ["contact"]],
  ["email", ["email"]],
  ["evidence-access", ["evidence-access"]],
  ["people-contacted", ["people-contacted"]],
  ["ca/demande-explications-autorites-competentes-fr", ["ca", "demande-explications-autorites-competentes-fr"]],
  ["link", ["link"]],
  ["nre", ["nre"]],
  ["policy/[policy]", ["policy", "privacy_policy"]],
  ["policy", ["policy"]],
  ["success", ["success"]],
  ["test", ["test"]],
];

test("all migrated Next pages have exactly one main landmark and no embedded skip link", () => {
  for (const [path, segments] of pages) {
    const source = readFileSync(new URL("app/[locale]/" + path + "/page.tsx", root), "utf8");
    assert.match(source, /<main\b[\s\S]{0,150}\bid="main-content"/, path);
    assert.doesNotMatch(source, /<SkipToMainContent\b/, path);
    assert.doesNotMatch(source, /import SkipToMainContent\b/, path);
    assert.equal(hasMainContentRoute(segments), true, path);
  }
  const preview = readFileSync(new URL("app/[locale]/home-preview/page.tsx", root), "utf8");
  assert.match(preview, /<main id="main-content"/);
  assert.doesNotMatch(preview, /<SkipToMainContent\b/);
  assert.equal(hasMainContentRoute(["home-preview"]), true);
});

test("the header owns the sole skip link before keyboard navigation controls", () => {
  const header = readFileSync(new URL("components/RouteHeader.tsx", root), "utf8");
  assert.match(header, /hasMainContentRoute\(parts\)/);
  assert.equal((header.match(/className="skip-to-main"/g) ?? []).length, 1);
  assert.ok(header.indexOf('className="skip-to-main"') < header.indexOf("<Container "));
  assert.match(header, /href="#main-content"/);
});

test("legacy aliases and nested legal pages keep a valid main target", () => {
  for (const parts of [
    ["nre-fr"], ["nre-en"], ["ca", "index"],
    ["policy", "legal"], ["policy", "impressum"],
    ["policy", "accessibility_statement"], ["policy", "cookie_policy"],
    ["policy", "privacy_policy"], ["policy", "service_terms"],
  ]) assert.equal(hasMainContentRoute(parts), true, parts.join("/"));
});

test("unknown, redirect-only and malformed identifiers never get dangling skip links", () => {
  for (const parts of [
    [], ["index"], ["unknown"], ["private"],
    ["policy", "unknown"], ["policy", "legal", "extra"],
    ["ca", "unpublished"], ["contact", "nested"],
    [42], ["contact", 1], ["contact", {}], null, 42, "contact",
  ]) assert.equal(hasMainContentRoute(parts), false, JSON.stringify(parts));
});
