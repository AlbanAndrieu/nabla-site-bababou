import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePrivacyPolicy,
  scanSourceMap,
  scanText,
  type PrivacyPolicy,
} from "../scripts/privacy-gate.ts";
import { identityFingerprint } from "../scripts/privacy-identities.ts";

const FAKE_POLICY_SOURCE = `# Privacy test fixture

- **Address**: Home address must not be disclosed. Use "Located in Example area" instead of 123 Example Street, 75000 Example City.
- **Private phone**: Last 2 digits of +33 6 12 34 56 78 must not be disclosed in outputs; use +33 6 12 34 56 XX when the number is shown.
`;

const POLICY: PrivacyPolicy = parsePrivacyPolicy(FAKE_POLICY_SOURCE);
const SYNTHETIC_CHILD_IDENTITIES = new Set([
  identityFingerprint("Example Protected Child"),
]);

test("parses protected values and safe replacements from project policy format", () => {
  assert.equal(POLICY.generalizedLocation, "Located in Example area");
  assert.equal(POLICY.protectedAddress, "123 Example Street, 75000 Example City");
  assert.equal(POLICY.privatePhone, "+33 6 12 34 56 78");
  assert.equal(POLICY.maskedPhone, "+33 6 12 34 56 XX");
});

test("generic adult address is publishable while the father phone is a rewrite outside contact", () => {
  const findings = scanText(
    "Address: 123-Example-Street 75000 Example City. Phone: +33.6.12.34.56.78",
    "public/example.html",
    POLICY,
  );

  assert.deepEqual(
    findings.map((finding) => [finding.category, finding.disposition]),
    [["private-phone", "REWRITE"]],
  );
});

test("detects a protected child identity without storing the real identity in generic fixtures", () => {
  const findings = scanText(
    "Example Protected Child appears in this public copy.",
    "public/index.html",
    POLICY,
    SYNTHETIC_CHILD_IDENTITIES,
  );

  assert.deepEqual(
    findings.map((finding) => [finding.category, finding.disposition]),
    [["protected-child-identity", "REWRITE"]],
  );
});

test("allows the approved display identity and recognition sentence only on public index", () => {
  const socialMetadata = scanText(
    '<meta property="og:title" content="Éléonore (Bababou) — Your Father Is Looking for You" />',
    "public/index.html",
    POLICY,
  );
  const visibleHeading = scanText(
    "<h1>Éléonore (Bababou) — If you are reading this</h1>",
    "public/index.html",
    POLICY,
  );
  const recognition = scanText(
    "<strong>Your real name is Éléonore</strong> (some people call you by other names, but Éléonore\nis who you truly are)",
    "public/index.html",
    POLICY,
  );
  const bareMetadata = scanText(
    '<meta property="og:title" content="Éléonore — Your Father Is Looking for You" />',
    "public/index.html",
    POLICY,
  );
  const otherFile = scanText(
    "Éléonore (Bababou)",
    "messages/en.json",
    POLICY,
  );

  assert.deepEqual(socialMetadata, []);
  assert.deepEqual(visibleHeading, []);
  assert.deepEqual(recognition, []);
  assert.deepEqual(bareMetadata.map((finding) => finding.category), [
    "protected-child-identity",
  ]);
  assert.deepEqual(otherFile.map((finding) => finding.category), [
    "protected-child-identity",
  ]);
});

test("allows only the approved given name on the dedicated RSS contact artifact", () => {
  const approvedFeedCopy = scanText(
    "Éléonore, si tu trouves ce site, tu peux me contacter.",
    "public/eleonore-feed.xml",
    POLICY,
  );
  const unrelatedSurface = scanText(
    "Éléonore",
    "messages/site/fr.json",
    POLICY,
  );
  const spellingVariant = scanText(
    "Elenore",
    "public/eleonore-feed.xml",
    POLICY,
  );
  const expandedIdentity = scanText(
    "Éléonore Céleste ANDRIEU BROOKE",
    "public/eleonore-feed.xml",
    POLICY,
  );

  assert.deepEqual(approvedFeedCopy, []);
  assert.deepEqual(unrelatedSurface.map((finding) => finding.category), [
    "protected-child-identity",
  ]);
  assert.deepEqual(spellingVariant.map((finding) => finding.category), [
    "protected-child-identity",
  ]);
  assert.ok(
    expandedIdentity.some(
      (finding) => finding.category === "protected-child-identity",
    ),
  );
});

test("detects unapproved child identity variants on the index", () => {
  const spellingVariant = scanText(
    "Elenore appears in ordinary public copy.",
    "public/index.html",
    POLICY,
  );
  const completeIdentity = scanText(
    "Éléonore Céleste ANDRIEU BROOKE",
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(spellingVariant.map((finding) => finding.category), [
    "protected-child-identity",
  ]);
  assert.ok(
    completeIdentity.some(
      (finding) => finding.category === "protected-child-identity",
    ),
  );
});

test("keeps the signature exception scoped while reviewing official identifiers", () => {
  const findings = scanText(
    "123 Example Street, 75000 Example City +33 6 12 34 56 78. Passport with ID: ZXCV123456.",
    "public/assets/nabla/signature/example.html",
    POLICY,
  );

  assert.deepEqual(
    findings.map((finding) => [finding.category, finding.disposition]),
    [["official-document-identifier", "REVIEW"]],
  );
});

test("allows the explicitly approved public identifier", () => {
  const findings = scanText(
    "French passport with ID: 14CV32249",
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(findings, []);
});

test("still detects other official document identifiers", () => {
  const findings = scanText(
    "The passport with ID: ZXCV123456 is no longer published.",
    "public/index.html",
    POLICY,
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.category, "official-document-identifier");
  assert.equal(findings[0]?.disposition, "REVIEW");
});

test("allows the approved passport asset but rejects other document artifacts", () => {
  const approved = scanText(
    '<img src="assets/passport-fr-bababou-4.png" alt="French passport illustration">',
    "public/index.html",
    POLICY,
  );
  const other = scanText(
    '<img src="assets/passport-example.png" alt="Document">',
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(approved, []);
  assert.deepEqual(
    other.map((finding) => [finding.category, finding.disposition]),
    [["official-document-artifact", "REVIEW"]],
  );
});

test("allows institutions, professional contacts and relevant map links", () => {
  const findings = scanText(
    [
      '<a href="https://goo.gl/maps/example">institution map</a>',
      "Example Court — case.worker@example.invalid",
      "The child attended an example kindergarten.",
    ].join("\n"),
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(findings, []);
});

test("allows intentional public phone and ordinary address data on contact surfaces", () => {
  const findings = scanText(
    "123 Example Street, 75000 Example City +33 6 12 34 56 78",
    "messages/contact/en.json",
    POLICY,
  );

  assert.deepEqual(findings, []);
});

test("scopes generated public contact data to contact/email artifacts", () => {
  const publicPhone = "+33 6 12 34 56 78";
  const contactHtml = scanText(
    publicPhone,
    ".next/server/app/en/contact.html",
    POLICY,
  );
  const contactCatalogChunk = scanText(
    publicPhone,
    ".next/server/chunks/ssr/messages_contact_en_json_example.js",
    POLICY,
  );
  const unrelatedRoute = scanText(
    publicPhone,
    ".next/server/app/en/link.html",
    POLICY,
  );

  assert.deepEqual(contactHtml, []);
  assert.deepEqual(contactCatalogChunk, []);
  assert.deepEqual(
    unrelatedRoute.map((finding) => [finding.category, finding.disposition]),
    [["private-phone", "REWRITE"]],
  );
});

test("detects high-confidence medical or psychological publication content", () => {
  const findings = scanText(
    "A psychological assessment is attached to this public page.",
    "public/index.html",
    POLICY,
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.category, "medical-or-psychological");
  assert.equal(findings[0]?.disposition, "REVIEW");
});

test("does not confuse technical diagnostics with medical information", () => {
  const findings = scanText(
    "The framework emits diagnostic output when a build cache is unavailable.",
    "lib/build-diagnostics.ts",
    POLICY,
  );

  assert.deepEqual(findings, []);
});

test("source-map scan ignores dependencies but checks project sourcesContent", () => {
  const sourceMap = JSON.stringify({
    version: 3,
    sources: [
      "../../node_modules/framework/diagnostics.js",
      "../../app/page.tsx",
    ],
    sourcesContent: [
      "export const diagnostic = 'technical diagnostic output';",
      "export const note = 'A psychological assessment must not be published.';",
    ],
    names: [],
    mappings: "",
  });

  const findings = scanSourceMap(
    sourceMap,
    ".next/server/chunks/example.js.map",
    POLICY,
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.category, "medical-or-psychological");
  assert.equal(findings[0]?.disposition, "REVIEW");
  assert.match(findings[0]?.file ?? "", /app\/page\.tsx$/);
});

test("source-map scan keeps intentional public contact phone exceptions", () => {
  const sourceMap = JSON.stringify({
    version: 3,
    sources: ["../../messages/contact/en.json"],
    sourcesContent: [
      '{"contactPage":{"methods":{"phone":{"value":"+33 6 12 34 56 78"}}}}',
    ],
    names: [],
    mappings: "",
  });

  const findings = scanSourceMap(
    sourceMap,
    ".next/server/chunks/contact.js.map",
    POLICY,
  );

  assert.deepEqual(findings, []);
});

test("accepts pseudonymized public copy and generalized location", () => {
  const findings = scanText(
    "Bababou. Located in Example area. Contact the public mailbox for this site.",
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(findings, []);
});

test("reviews GDPR-style special-category personal data", () => {
  const findings = scanText(
    "Sexual orientation: synthetic fixture value.",
    "public/example.html",
    POLICY,
  );

  assert.deepEqual(
    findings.map((finding) => [finding.category, finding.disposition]),
    [["special-category-personal-data", "REVIEW"]],
  );
});

test("blocks high-confidence financial account details", () => {
  const findings = scanText(
    "IBAN: FR76 0000 0000 0000 0000 0000 000",
    "public/example.html",
    POLICY,
  );

  assert.deepEqual(
    findings.map((finding) => [finding.category, finding.disposition]),
    [["father-financial", "BLOCK"]],
  );
});
