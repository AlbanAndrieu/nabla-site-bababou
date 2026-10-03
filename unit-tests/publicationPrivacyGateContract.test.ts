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
  assert.match(
    source,
    /image-requires-flattened-reviewed-publication-copy/,
  );
});

test("publication gate requires explicit review and irreversible PDF verification", () => {
  assert.match(source, /config\/publication-review\.json/);
  assert.match(source, /irreversibleRedactionVerified/);
  assert.match(source, /metadataReviewed/);
  assert.match(source, /pdftotext/);
  assert.match(source, /pdfinfo/);
  assert.match(source, /pdfdetach/);
  assert.match(source, /pdf-embedded-file/);
  assert.equal(
    pkg.scripts?.["privacy:publication"],
    "node --experimental-strip-types scripts/publication-privacy-gate.ts",
  );
});
