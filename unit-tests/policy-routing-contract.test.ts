import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  NATIVE_LOCALIZED_POLICY_SLUGS,
  POLICY_PAGES,
  POLICY_PAGE_SLUGS,
} from "../lib/policyPages.ts";

const NATIVE_POLICY_SLUGS = new Set(NATIVE_LOCALIZED_POLICY_SLUGS);

test("all reviewed policy pages are owned by the native registry", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.deepEqual(
    [...NATIVE_LOCALIZED_POLICY_SLUGS].sort(),
    [...POLICY_PAGE_SLUGS].sort(),
  );
  assert.equal(NATIVE_POLICY_SLUGS.size, POLICY_PAGE_SLUGS.length);
  assert.doesNotMatch(config, /policyRewrites/);
  assert.doesNotMatch(config, /localizedPolicyRewrites/);
  assert.match(config, /const migratedPolicyRedirects = \[/);
  assert.match(route, /POLICY_PAGE_SLUGS/);
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getPolicyPage/);
  assert.match(route, /<SkipToMainContent \/>/);
  assert.match(route, /<TopAnchor \/>/);
  assert.doesNotMatch(route, /PublicHtmlFragment/);

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
      `${policy.sourceFile} must retain its reviewed archival content`,
    );
    assert.ok(
      legacy.includes(`<title>${policy.title}</title>`),
      `${policy.sourceFile} metadata should stay represented in the registry`,
    );
    assert.match(config, new RegExp(`\\"${slug}\\"`));
  }
});

test("localized policies own native content instead of the legacy HTML bridge", async () => {
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );
  const privacyContent = await readFile(
    new URL("../components/policy/PrivacyPolicyContent.tsx", import.meta.url),
    "utf8",
  );
  const privacyCopy = await readFile(
    new URL("../lib/privacyPolicy.ts", import.meta.url),
    "utf8",
  );
  const serviceContent = await readFile(
    new URL("../components/policy/ServiceTermsContent.tsx", import.meta.url),
    "utf8",
  );
  const serviceCopy = await readFile(
    new URL("../lib/serviceTerms.ts", import.meta.url),
    "utf8",
  );
  const legalContent = await readFile(
    new URL("../components/policy/LegalPolicyContent.tsx", import.meta.url),
    "utf8",
  );
  const legalCopy = await readFile(
    new URL("../lib/legalPolicies.ts", import.meta.url),
    "utf8",
  );
  const publicContent = await readFile(
    new URL("../components/policy/PublicPolicyContent.tsx", import.meta.url),
    "utf8",
  );
  const publicCopy = await readFile(
    new URL("../lib/publicPolicies.ts", import.meta.url),
    "utf8",
  );

  assert.match(route, /policy === "privacy_policy"/);
  assert.match(route, /<PrivacyPolicyContent locale=\{locale\} \/>/);
  assert.match(privacyContent, /getPrivacyPolicyCopy/);
  assert.match(privacyCopy, /satisfies Record<AppLocale, PrivacyPolicyCopy>/);

  assert.match(route, /policy === "service_terms"/);
  assert.match(route, /<ServiceTermsContent locale=\{locale\} \/>/);
  assert.match(serviceContent, /getServiceTermsCopy/);
  assert.match(serviceCopy, /satisfies Record<AppLocale, ServiceTermsCopy>/);

  assert.match(route, /policy === "legal" \|\| policy === "impressum"/);
  assert.match(
    route,
    /<LegalPolicyContent locale=\{locale\} policy=\{policy\} \/>/,
  );
  assert.match(legalContent, /getLegalPolicyCopy/);
  assert.match(
    legalCopy,
    /satisfies Record<\s*LegalPolicySlug,\s*Record<AppLocale, LegalPolicyCopy>\s*>/,
  );

  assert.match(route, /<PublicPolicyContent locale=\{locale\} policy=\{policy\} \/>/);
  assert.match(route, /getPublicPolicyCopy/);
  assert.match(publicContent, /getPublicPolicyCopy/);
  assert.match(
    publicCopy,
    /satisfies Record<\s*PublicPolicySlug,\s*Record<AppLocale, PublicPolicyCopy>\s*>/,
  );
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

test("policy migration does not touch the protected homepage routing contract", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(config, /index\.html/);
  assert.doesNotMatch(config, /404\.html/);
});
