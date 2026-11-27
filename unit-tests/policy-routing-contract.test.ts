import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { POLICY_ROUTE_SLUGS } from "../lib/mainContentRoute.mjs";
import { POLICY_PAGE_SLUGS, POLICY_PAGES } from "../lib/policyPages.ts";

test("all reviewed policy pages are owned by the native registry", async () => {
  const config = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );
  const htmlBridge = await readFile(
    new URL("../lib/htmlFromPublic.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(config, /policyRewrites/);
  assert.doesNotMatch(config, /localizedPolicyRewrites/);
  assert.match(
    config,
    /const migratedPolicyRedirects = POLICY_ROUTE_SLUGS\.map/,
  );
  assert.deepEqual(
    [...POLICY_ROUTE_SLUGS].sort(),
    [...POLICY_PAGE_SLUGS].sort(),
  );
  assert.match(route, /POLICY_PAGE_SLUGS/);
  assert.match(route, /generateStaticParams/);
  assert.match(route, /getPolicyPage/);
  // The header owns the first keyboard tab stop and the page owns the target.
  const header = await readFile(
    new URL("../components/RouteHeader.tsx", import.meta.url),
    "utf8",
  );
  const routeGuard = await readFile(
    new URL("../lib/mainContentRoute.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(route, /<SkipToMainContent \/>/);
  assert.match(route, /id="main-content"/);
  assert.match(header, /hasMainContentRoute\(parts\)/);
  assert.match(header, /className="skip-to-main" href="#main-content"/);
  assert.match(routeGuard, /"policy"/);
  assert.match(route, /<TopAnchor \/>/);
  assert.doesNotMatch(route, /PublicHtmlFragment/);
  assert.doesNotMatch(route, /htmlFromPublic/);
  assert.match(htmlBridge, /404\.html/);
  assert.doesNotMatch(htmlBridge, /policy\//);
  assert.doesNotMatch(htmlBridge, /test\.html/);

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
    assert.ok(POLICY_ROUTE_SLUGS.includes(slug), slug);
  }
});

test("security.txt points to the canonical localized privacy policy", async () => {
  const security = await readFile(
    new URL("../public/security.txt", import.meta.url),
    "utf8",
  );

  assert.match(
    security,
    /^Policy: https:\/\/www\.bababou\.com\/fr\/policy\/privacy_policy$/m,
  );
  assert.doesNotMatch(security, /\/policy\/privacy\.html/);
});

test("localized policies own native content instead of the legacy HTML bridge", async () => {
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );
  const copyProvider = await readFile(
    new URL("../lib/nativePolicyCatalog.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /getNativePolicyCopy/);
  assert.match(route, /localizedPolicyPath/);
  assert.match(copyProvider, /getNativePolicyCopy/);
  assert.match(copyProvider, /localizedPolicyPath/);
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

  assert.match(
    route,
    /<PublicPolicyContent locale=\{locale\} policy=\{policy\} \/>/,
  );
  assert.match(copyProvider, /getPublicPolicyCopy/);
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
  // /index.html may only receive a gated noindex header, never a redirect.
  const { default: nextConfig } = await import("../next.config.mjs");
  const sources = (await nextConfig.redirects()).map(
    (r: { source: string }) => r.source,
  );

  assert.ok(!sources.includes("/index.html"));
  assert.ok(!sources.includes("/404.html"));
});
