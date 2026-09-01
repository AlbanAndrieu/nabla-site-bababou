import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const LEGACY_REWRITE_POLICY_FILES = [
  "legal",
  "impressum",
  "privacy_policy",
  "service_terms",
] as const;

const NEXT_POLICY_FILES = ["accessibility_statement", "cookie_policy"] as const;

const POLICY_SOURCE_FILES = [
  ...LEGACY_REWRITE_POLICY_FILES,
  ...NEXT_POLICY_FILES,
] as const;

test("remaining policy pages keep clean rewrites without replacing static sources", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.match(config, /const policyRewrites = policyFiles\.map/);
  assert.match(config, /const localizedPolicyRewrites = policyLocales\.flatMap/);
  assert.match(
    config,
    /afterFiles: \[\.\.\.localizedPolicyRewrites, \.\.\.policyRewrites\]/,
  );

  for (const policy of POLICY_SOURCE_FILES) {
    const legacy = await readFile(
      new URL(`../public/policy/${policy}.html`, import.meta.url),
      "utf8",
    );
    assert.ok(
      legacy.trim().length > 0,
      `${policy}.html must remain a reviewed source during migration`,
    );
  }

  for (const policy of LEGACY_REWRITE_POLICY_FILES) {
    assert.match(config, new RegExp(`\\"${policy}\\"`));
  }
});

test("migrated policy clean routes are owned by Next while static copy remains source", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  for (const policy of NEXT_POLICY_FILES) {
    const route = await readFile(
      new URL(`../app/[locale]/policy/${policy}/page.tsx`, import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(config, new RegExp(`\\"${policy}\\"`));
    assert.match(route, new RegExp(`policy\\/${policy}\\.html`));
    assert.match(route, new RegExp(`CANONICAL_PATH = \\"\\/policy\\/${policy}\\"`));
    assert.match(route, /lang=\"en\"/);
    assert.match(route, /<SkipToMainContent \/>/);
    assert.match(route, /<TopAnchor \/>/);
  }
});

test("policy migration does not touch the protected homepage or static 404 contract", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(config, /index\.html/);
  assert.doesNotMatch(config, /404\.html/);
});
