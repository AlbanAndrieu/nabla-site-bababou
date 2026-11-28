import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  hasMainContentRoute,
  LEGACY_HTML_REDIRECT_SLUGS,
  NEXT_CANONICAL_SLUGS,
  POLICY_ROUTE_SLUGS,
} from "../lib/mainContentRoute.mjs";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Next, sitemap and skip links share the canonical slug registry", () => {
  const config = read("next.config.mjs");
  const catalog = read("lib/sitePageCatalog.ts");
  assert.match(config, /LEGACY_HTML_REDIRECT_SLUGS\.flatMap/);
  assert.match(config, /POLICY_ROUTE_SLUGS\.map/);
  assert.match(catalog, /new Set<string>\(NEXT_CANONICAL_SLUGS\)/);
  assert.equal(new Set(NEXT_CANONICAL_SLUGS).size, NEXT_CANONICAL_SLUGS.length);
  for (const slug of NEXT_CANONICAL_SLUGS) {
    assert.ok(
      existsSync(
        new URL("../app/[locale]/" + slug + "/page.tsx", import.meta.url),
      ),
      slug,
    );
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
    assert.ok(
      existsSync(
        new URL("../public/policy/" + slug + ".html", import.meta.url),
      ),
      slug,
    );
    assert.equal(hasMainContentRoute(["policy", slug]), true);
  }
  assert.equal(
    [...registrySource.matchAll(/^ {2}[a-z_]+: \{/gm)].length,
    POLICY_ROUTE_SLUGS.length,
  );
});

test("unknown, noncanonical and malformed route names fail closed", () => {
  for (const parts of [
    [],
    ["index"],
    ["login"],
    ["private"],
    ["policy", "unapproved"],
    ["contact", "unexpected"],
    ["policy", "privacy_policy", "nested"],
    [42],
    ["contact", {}],
    ["invalid/slug"],
    null,
    undefined,
  ])
    assert.equal(hasMainContentRoute(parts), false, JSON.stringify(parts));
});

test("legacy article review routes are localized but not sitemap canonicals", () => {
  const reviews = ["for-fathers", "abduction-norway", "abduction-germany"];
  const config = read("next.config.mjs");
  const article = read("components/legacy-articles/LegacyArticleReview.tsx");
  const navigation = read("app/[locale]/abduction/page.tsx");
  const loaders = read("i18n/messages.ts");
  assert.match(config, /"abduction-germany"/);
  assert.match(config, /noindex, nofollow, nosnippet/);
  assert.match(article, /robots: \{ index: false, follow: false \}/);
  assert.doesNotMatch(article, /dangerouslySetInnerHTML|\.pdf"|\.docx"/);
  assert.match(navigation, /catalog\.reviewNavigation/);
  assert.match(article, /LegacyAssociationsSection locale=\{locale\}/);
  assert.match(loaders, /LEGACY_ARTICLES_LOADERS/);

  const locales = ["fr", "en", "de", "no"];
  for (const slug of reviews) {
    assert.equal(hasMainContentRoute([slug]), true);
    assert.equal(NEXT_CANONICAL_SLUGS.includes(slug), false);
    assert.equal(LEGACY_HTML_REDIRECT_SLUGS.includes(slug), false);
    assert.ok(
      existsSync(
        new URL("../app/[locale]/" + slug + "/page.tsx", import.meta.url),
      ),
    );
    assert.ok(
      existsSync(new URL("../public/" + slug + ".html", import.meta.url)),
    );
    const route = read("app/[locale]/" + slug + "/page.tsx");
    assert.match(route, /force-static/);
    assert.match(route, /reviewArticleMetadata/);
    assert.match(route, /setRequestLocale/);
  }

  let expectedKeys;
  for (const locale of locales) {
    const catalog = JSON.parse(
      read("messages/legacy-articles/" + locale + ".json"),
    ).legacyArticlesPage;
    const keys = Object.keys(catalog).sort();
    if (expectedKeys) assert.deepEqual(keys, expectedKeys, locale);
    expectedKeys = keys;
    assert.ok(catalog.reviewNavigation);
    for (const [kind, sections] of [
      ["fathers", ["context", "rights", "obstacles", "support"]],
      ["norway", ["scope", "law", "decision", "documents"]],
      ["germany", ["scope", "article27", "residence", "documents"]],
    ]) {
      assert.deepEqual(
        Object.keys(catalog[kind].sections).sort(),
        [...sections].sort(),
        locale + "/" + kind,
      );
      assert.ok(catalog[kind].title.length > 10);
      assert.ok(
        Object.values(catalog[kind].sections).every(
          (section) => section.heading.length > 5 && section.body.length > 60,
        ),
      );
    }
  }
});
