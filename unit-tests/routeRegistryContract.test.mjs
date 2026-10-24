import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  NEXT_CANONICAL_SLUGS, LEGACY_HTML_REDIRECT_SLUGS, POLICY_ROUTE_SLUGS,
  hasMainContentRoute,
} from "../lib/mainContentRoute.mjs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Next, sitemap and skip links share the canonical slug registry", () => {
  const config = read("next.config.mjs");
  const catalog = read("lib/sitePageCatalog.ts");
  assert.match(config, /LEGACY_HTML_REDIRECT_SLUGS\.flatMap/);
  assert.match(config, /POLICY_ROUTE_SLUGS\.map/);
  assert.match(catalog, /new Set<string>\(NEXT_CANONICAL_SLUGS\)/);
  assert.equal(new Set(NEXT_CANONICAL_SLUGS).size, NEXT_CANONICAL_SLUGS.length);
  for (const slug of NEXT_CANONICAL_SLUGS) {
    assert.ok(existsSync(new URL("../app/[locale]/" + slug + "/page.tsx", import.meta.url)), slug);
    assert.equal(hasMainContentRoute([slug]), true);
  }
  for (const slug of LEGACY_HTML_REDIRECT_SLUGS) {
    assert.ok(NEXT_CANONICAL_SLUGS.includes(slug), slug);
  }
});

test("policy metadata and reviewed HTML match redirect and skip-link slugs", () => {
  const registrySource = read("lib/policyPages.ts");
  assert.equal(new Set(POLICY_ROUTE_SLUGS).size, POLICY_ROUTE_SLUGS.length);
  for (const slug of POLICY_ROUTE_SLUGS) {
    assert.match(registrySource, new RegExp("^  " + slug + ": \\{", "m"));
    assert.ok(existsSync(new URL("../public/policy/" + slug + ".html", import.meta.url)), slug);
    assert.equal(hasMainContentRoute(["policy", slug]), true);
  }
  assert.equal([...registrySource.matchAll(/^  [a-z_]+: \{/gm)].length, POLICY_ROUTE_SLUGS.length);
});

test("unknown, noncanonical and malformed route names fail closed", () => {
  for (const parts of [
    [], ["index"], ["login"], ["private"], ["policy", "unapproved"], 
    ["contact", "unexpected"], ["policy", "privacy_policy", "nested"],
    [42], ["contact", {}], ["invalid/slug"], null, undefined,
  ]) assert.equal(hasMainContentRoute(parts), false, JSON.stringify(parts));
});
