import assert from "node:assert/strict";
import { access, readdir } from "node:fs/promises";
import test from "node:test";

const caRoot = new URL("../public/ca/", import.meta.url);
const frenchCandidate = new URL(
  "../public/ca/demande-explications-autorites-competentes-fr.html",
  import.meta.url,
);
const englishCandidate = new URL(
  "../public/ca/demande-explications-autorites-competentes-en.html",
  import.meta.url,
);

test("next low-risk CA document migration remains blocked without an approved EN counterpart", async () => {
  await access(frenchCandidate);
  await assert.rejects(
    access(englishCandidate),
    "an EN counterpart now exists: review its provenance and update the migration plan before enabling the pair",
  );
});

test("public CA HTML inventory stays explicit and does not silently grow", async () => {
  const entries = (await readdir(caRoot))
    .filter((name) => name.endsWith(".html"))
    .sort();

  assert.deepEqual(entries, [
    "demande-explications-autorites-competentes-fr.html",
    "index.html",
  ]);
});
