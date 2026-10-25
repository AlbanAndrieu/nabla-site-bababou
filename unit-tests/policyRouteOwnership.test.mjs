import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("P4 sitemap and policy pages use one localized URL provider", () => {
  const paths = read("lib/policyRoutePaths.ts");
  const sitemap = read("app/sitemap.ts");
  const index = read("app/[locale]/policy/page.tsx");
  const native = read("lib/nativePolicyCatalog.ts");

  assert.match(paths, /export function localizedPolicyIndexPath/);
  assert.match(paths, /export function localizedPolicyPath/);
  assert.match(paths, /routing\.defaultLocale/);
  assert.match(paths, /getPolicyPage\(policy\)\.canonicalPath/);
  assert.match(sitemap, /from "@\/lib\/policyRoutePaths"/);
  assert.match(index, /from "@\/lib\/policyRoutePaths"/);
  assert.match(native, /export \{ localizedPolicyPath \} from "@\/lib\/policyRoutePaths"/);
  assert.doesNotMatch(sitemap, /function localizedPolicy(?:Index)?Path\(/);
  assert.doesNotMatch(index, /function localizedPolicyIndexPath\(/);
});

test("P3/P4 keep default French canonicals without phantom localized homepage paths", () => {
  const paths = read("lib/policyRoutePaths.ts");
  const sitemap = read("app/sitemap.ts");
  assert.match(paths, /locale === routing\.defaultLocale \? "\/policy"/);
  assert.match(sitemap, /policyIndexSitemapEntry/);
  assert.match(sitemap, /policySitemapEntries/);
  assert.doesNotMatch(paths, /\/home-preview/);
});
