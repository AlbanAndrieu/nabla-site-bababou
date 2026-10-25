import assert from "node:assert/strict";
import test from "node:test";

import { routing } from "../i18n/routing.ts";
import {
  getNativePolicyCopy,
  localizedPolicyPath,
} from "../lib/nativePolicyCatalog.ts";
import { getPolicyPage, POLICY_PAGE_SLUGS } from "../lib/policyPages.ts";
import { localizedPolicyIndexPath } from "../lib/policyRoutePaths.ts";

test("six policy slugs retain the same extensionless canonicals across four locales", () => {
  for (const locale of routing.locales) {
    for (const slug of POLICY_PAGE_SLUGS) {
      const sourcePath = getPolicyPage(slug).canonicalPath;
      const expected =
        locale === routing.defaultLocale
          ? sourcePath
          : `/${locale}${sourcePath}`;
      assert.equal(localizedPolicyPath(slug, locale), expected, slug + ":" + locale);
      assert.doesNotMatch(expected, /\.html$/);
    }
  }
});

test("native policy provider resolves reviewed titles and descriptions for every locale", () => {
  for (const locale of routing.locales) {
    for (const slug of POLICY_PAGE_SLUGS) {
      const copy = getNativePolicyCopy(slug, locale);
      assert.equal(typeof copy.title, "string", slug + ":" + locale);
      assert.ok(copy.title.trim(), slug + ":" + locale);
      assert.equal(typeof copy.metadataTitle, "string");
      assert.ok(copy.metadataTitle.trim());
      assert.equal(typeof copy.metadataDescription, "string");
      assert.ok(copy.metadataDescription.trim());
    }
  }
});

test("policy index canonicals share the same locale paths as the sitemap", () => {
  for (const locale of routing.locales) {
    const expected =
      locale === routing.defaultLocale ? "/policy" : `/${locale}/policy`;
    assert.equal(localizedPolicyIndexPath(locale), expected, locale);
  }
});
