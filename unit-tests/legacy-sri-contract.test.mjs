import assert from "node:assert/strict";
import test from "node:test";
import {
  REVIEWED_DOCUMENTS,
  DYNAMIC_EXCEPTIONS,
  inspectMarkup,
  auditApprovedHtml,
} from "../scripts/security/audit-external-sri.mjs";

const CDN = "https://code.jquery.com/jquery-3.3.1.slim.min.js";
const PIN = "sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo";

test("approved HTML external dependencies remain SRI-pinned or explicitly tracked", async () => {
  assert.deepEqual(REVIEWED_DOCUMENTS, [
    "public/index.html",
    "public/ca/demande-explications-autorites-competentes-fr.html",
  ]);
  const result = await auditApprovedHtml();
  assert.equal(result.reviewed, 2);
  assert.ok(result.verifiedTags >= 3);
  assert.ok(result.dynamicExceptions >= 2);
  assert.deepEqual(DYNAMIC_EXCEPTIONS.length, 2);
});

test("any newly introduced unpinned immutable script or stylesheet fails", () => {
  const safe = inspectMarkup('<script src="' + CDN + '" integrity="' + PIN + '" crossorigin="anonymous"></script>');
  assert.equal(safe.verifiedTags, 1);
  assert.deepEqual(safe.findings, []);
  const unsafe = inspectMarkup('<script src="' + CDN + '"></script>');
  assert.equal(unsafe.findings[0], "immutable-resource-missing-SRI-or-CORS");
  const unknown = inspectMarkup('<script src="https://unapproved.example/script.js"></script>');
  assert.equal(unknown.findings[0], "external-resource-not-classified");
});

test("dynamic Cloudflare Turnstile stays an explicit exception, not a false positive pass", () => {
  const result = inspectMarkup('<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>');
  assert.equal(result.dynamicExceptions, 1);
  assert.equal(result.verifiedTags, 0);
});
