import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [script, configSource, packageSource] = await Promise.all([
  readFile(
    new URL("../scripts/prepare-private-consolidation.ts", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../config/private-consolidation.json", import.meta.url),
    "utf8",
  ),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);
const config = JSON.parse(configSource) as {
  collections?: Array<{ id?: string; sources?: Array<{ path?: string }> }>;
};
const pkg = JSON.parse(packageSource) as { scripts?: Record<string, string> };

test("private consolidation is dependency-free and writes only ignored work products", () => {
  assert.equal(
    pkg.scripts?.["privacy:consolidate-private"],
    "node --experimental-strip-types scripts/prepare-private-consolidation.ts",
  );
  assert.match(script, /\.private-publication-source\//);
  assert.match(script, /\.redaction-work\/consolidation\//);
  assert.match(script, /pdftotext/);
  assert.match(script, /textSha256/);
  assert.match(script, /duplicateParagraphs/);
  assert.match(script, /Draft privé consolidé\. Ne pas publier directement/);
  assert.doesNotMatch(script, /writeFile\([^)]*public\//s);
});

test("authority explanation collection references the private PDF and recovered HTML drafts", () => {
  const collection = config.collections?.find(
    (candidate) =>
      candidate.id === "demande-explications-autorites-competentes",
  );
  assert.ok(collection);

  const paths = collection.sources?.map((source) => source.path) ?? [];
  assert.ok(
    paths.includes(
      "public/ca/demande-explications-autorites-competentes-fr.html",
    ),
  );
  assert.ok(
    paths.some(
      (value) =>
        value.includes("Gmail - Demande d") &&
        value.endsWith("autorités compétentes.pdf"),
    ),
  );
  for (const suffix of [
    "demande-explications-autorites-competentes-en.html",
    "gmail-absence-reponse-proposition-fr.html",
    "gmail-clarifications-maintien-demande-fr.html",
    "gmail-follow-up-hague-status-fr.html",
    "gmail-transmission-dossier-rappels-retour-fr.html",
  ]) {
    assert.ok(
      paths.some((value) => value.endsWith(suffix)),
      suffix,
    );
  }
});
