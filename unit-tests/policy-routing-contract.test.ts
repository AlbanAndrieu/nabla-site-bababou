import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const POLICY_FILES = [
  "legal",
  "impressum",
  "privacy_policy",
  "service_terms",
  "cookie_policy",
  "accessibility_statement",
] as const;

test("policy pages get clean Next/Vercel entry points without replacing static sources", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.match(config, /const policyRewrites = policyFiles\.map/);
  assert.match(config, /const localizedPolicyRewrites = policyLocales\.flatMap/);
  assert.match(config, /afterFiles: \[\.\.\.localizedPolicyRewrites, \.\.\.policyRewrites\]/);

  for (const policy of POLICY_FILES) {
    const legacy = await readFile(
      new URL(`../public/policy/${policy}.html`, import.meta.url),
      "utf8",
    );

    assert.ok(legacy.trim().length > 0, `${policy}.html must remain the source during Migration 6`);
    assert.match(config, new RegExp(`\\"${policy}\\"`));
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
