import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import { POLICY_PAGES, POLICY_PAGE_SLUGS } from "../lib/policyPages.ts";

test("all reviewed policy pages are owned by the native registry", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(config, /policyRewrites/);
  assert.doesNotMatch(config, /localizedPolicyRewrites/);
  assert.match(config, /const migratedPolicyRedirects = \[/);
  assert.match(route, /POLICY_PAGE_SLUGS/);
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getPolicyPage/);
  assert.match(route, /<SkipToMainContent \/>/);
  assert.match(route, /<TopAnchor \/>/);

  for (const slug of POLICY_PAGE_SLUGS) {
    const policy = POLICY_PAGES[slug];
    const legacy = await readFile(
      new URL(`../public/${policy.sourceFile}`, import.meta.url),
      "utf8",
    );

    assert.equal(policy.sourceFile, `policy/${slug}.html`);
    assert.equal(policy.canonicalPath, `/policy/${slug}`);
    assert.ok(
      legacy.includes(`<h1>${policy.heading}</h1>`),
      `${policy.sourceFile} must remain the reviewed content source`,
    );
    assert.ok(
      legacy.includes(`<title>${policy.title}</title>`),
      `${policy.sourceFile} metadata should stay represented in the registry`,
    );
    assert.match(config, new RegExp(`\\"${slug}\\"`));
  }
});

test("policy-specific route copies collapse into the generic registry route", async () => {
  const entries = await readdir(
    new URL("../app/[locale]/policy/", import.meta.url),
    { withFileTypes: true },
  );
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  assert.ok(directories.includes("[policy]"));
  assert.ok(!directories.includes("accessibility_statement"));
  assert.ok(!directories.includes("cookie_policy"));
});

test("policy migration does not touch the protected homepage or static 404 contract", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(config, /index\.html/);
  assert.doesNotMatch(config, /404\.html/);
});
