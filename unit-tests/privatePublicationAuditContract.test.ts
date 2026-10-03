import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const script = await readFile(
  new URL("../scripts/audit-private-publication.ts", import.meta.url),
  "utf8",
);
const identities = await readFile(
  new URL("../scripts/privacy-identities.ts", import.meta.url),
  "utf8",
);
const packageSource = await readFile(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const pkg = JSON.parse(packageSource) as { scripts?: Record<string, string> };

test("private publication audit is local-only and does not echo protected values", () => {
  assert.match(script, /\.private-publication-source/);
  assert.match(script, /\.redaction-work\/private-audit\.json/);
  assert.match(script, /artifactId/);
  assert.match(script, /protected-father-identity/);
  assert.match(script, /protected-mother-identity/);
  assert.match(script, /pdf-no-extractable-text-manual-review-required/);
  assert.match(script, /image-manual-visual-review-required/);
  assert.doesNotMatch(script, /console\.log\([^\n]*artifact\.path/);
  assert.doesNotMatch(script, /console\.log\([^\n]*finding\.file/);
  assert.equal(
    pkg.scripts?.["privacy:audit-private"],
    "node --experimental-strip-types scripts/audit-private-publication.ts",
  );
});

test("parent identity detection uses fingerprints rather than plaintext publication data", () => {
  assert.match(identities, /PROTECTED_FATHER_IDENTITY_FINGERPRINTS/);
  assert.match(identities, /PROTECTED_MOTHER_IDENTITY_FINGERPRINTS/);
  assert.doesNotMatch(
    identities,
    /PROTECTED_FATHER_IDENTITY_FINGERPRINTS[^;]*(?:Alban|Eric|Alexandre)/s,
  );
  assert.doesNotMatch(
    identities,
    /PROTECTED_MOTHER_IDENTITY_FINGERPRINTS[^;]*(?:Rachael|Elaine)/s,
  );
});
