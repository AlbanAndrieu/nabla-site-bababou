import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const LEGACY_REWRITE_POLICY_FILES = [
  "legal",
  "impressum",
  "privacy_policy",
  "service_terms",
  "cookie_policy",
] as const;

const POLICY_SOURCE_FILES = [
  ...LEGACY_REWRITE_POLICY_FILES,
  "accessibility_statement",
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

test("accessibility policy clean route is owned by Next while static copy remains source", async () => {
  const [config, route] = await Promise.all([
    readFile(new URL("../next.config.mjs", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../app/[locale]/policy/accessibility_statement/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);

  assert.doesNotMatch(config, /\"accessibility_statement\"/);
  assert.match(route, /policy\/accessibility_statement\.html/);
  assert.match(route, /CANONICAL_PATH = \"\/policy\/accessibility_statement\"/);
  assert.match(route, /lang=\"en\"/);
  assert.match(route, /<SkipToMainContent \/>/);
  assert.match(route, /<TopAnchor \/>/);
});

test("policy migration does not touch the protected homepage or static 404 contract", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(config, /index\.html/);
  assert.doesNotMatch(config, /404\.html/);
});
