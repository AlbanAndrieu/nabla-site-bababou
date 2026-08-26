import assert from "node:assert/strict";
import test from "node:test";

import {
  parsePrivacyPolicy,
  scanText,
  type PrivacyPolicy,
} from "../scripts/privacy-gate.ts";

const FAKE_POLICY_SOURCE = `# Privacy test fixture

- **Address**: Home address must not be disclosed. Use "Located in Example area" instead of 123 Example Street, 75000 Example City.
- **Private phone**: Last 2 digits of +33 6 12 34 56 78 must not be disclosed in outputs; use +33 6 12 34 56 XX when the number is shown.
`;

const POLICY: PrivacyPolicy = parsePrivacyPolicy(FAKE_POLICY_SOURCE);

test("parses protected values and safe replacements from project policy format", () => {
  assert.equal(POLICY.generalizedLocation, "Located in Example area");
  assert.equal(POLICY.protectedAddress, "123 Example Street, 75000 Example City");
  assert.equal(POLICY.privatePhone, "+33 6 12 34 56 78");
  assert.equal(POLICY.maskedPhone, "+33 6 12 34 56 XX");
});

test("detects punctuation and spacing variants of protected address and phone", () => {
  const findings = scanText(
    "Address: 123-Example-Street 75000 Example City. Phone: +33.6.12.34.56.78",
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(
    findings.map((finding) => finding.category).sort(),
    ["private-phone", "protected-address"],
  );
});

test("keeps the signature exception scoped to address and phone only", () => {
  const findings = scanText(
    "123 Example Street, 75000 Example City +33 6 12 34 56 78. Passport with ID: ZXCV123456.",
    "public/assets/nabla/signature/example.html",
    POLICY,
  );

  assert.deepEqual(findings.map((finding) => finding.category), [
    "official-document-identifier",
  ]);
});

test("detects official document identifiers without storing real values", () => {
  const findings = scanText(
    "The passport with ID: ZXCV123456 is no longer published.",
    "public/index.html",
    POLICY,
  );

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.category, "official-document-identifier");
});

test("detects document image references, precise maps and child institutions", () => {
  const findings = scanText(
    [
      '<img src="assets/passport-example.png" alt="Document">',
      '<a href="https://goo.gl/maps/example">map</a>',
      "The child attended an example barnehage.",
    ].join("\n"),
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(
    findings.map((finding) => finding.category).sort(),
    [
      "child-school-or-routine",
      "official-document-artifact",
      "precise-location-link",
    ],
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
});

test("accepts minimized public contact and generalized location copy", () => {
  const findings = scanText(
    "Located in Example area. Contact the dedicated public mailbox for this site.",
    "public/index.html",
    POLICY,
  );

  assert.deepEqual(findings, []);
});
