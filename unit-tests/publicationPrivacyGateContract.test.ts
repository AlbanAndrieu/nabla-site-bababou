import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../scripts/publication-privacy-gate.ts", import.meta.url),
  "utf8",
);
const packageSource = await readFile(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const pkg = JSON.parse(packageSource) as { scripts?: Record<string, string> };

test("publication gate fails closed on raw family/legal source formats", () => {
  assert.match(source, /public\/eml\//);
  assert.match(source, /raw-source-artifact-not-publishable/);
  for (const extension of [".docx", ".eml", ".odg", ".xoj"]) {
    assert.ok(source.includes(`"${extension}"`));
  }
  assert.match(source, /image-requires-explicit-reviewed-publication-copy/);
  assert.match(source, /disposition: "BLOCK"/);
  assert.match(source, /disposition: "REVIEW"/);
  assert.match(source, /disposition: "REWRITE"/);
});

test("publication gate requires explicit review and irreversible PDF verification", () => {
  assert.match(source, /config\/publication-review\.json/);
  assert.match(source, /irreversibleRedactionVerified/);
  assert.match(source, /metadataReviewed/);
  assert.match(source, /pdftotext/);
  assert.match(source, /pdfinfo/);
  assert.match(source, /pdfdetach/);
  assert.match(source, /pdf-embedded-file/);
  assert.match(source, /sensitiveDataApproved/);
  assert.match(source, /officialIdentifiersReviewed/);
  assert.match(source, /father-identity/);
  assert.match(source, /mother-identity/);
  assert.equal(
    pkg.scripts?.["privacy:publication"],
    "node --experimental-strip-types scripts/publication-privacy-gate.ts",
  );
});
