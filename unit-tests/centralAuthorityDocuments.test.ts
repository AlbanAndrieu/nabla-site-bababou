import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { listCentralAuthorityDocuments } from "../lib/centralAuthorityDocuments.ts";

const STALE_LEGACY_LINK = "gmail-clarifications-maintien-demande-en.html";

test("central authority document hub derives links from retained files", async () => {
  const documents = await listCentralAuthorityDocuments();

  assert.ok(documents.length > 0, "expected retained ca/ HTML documents");
  assert.equal(documents.some((document) => document.relativePath === "index.html"), false);
  assert.equal(
    documents.some((document) => document.relativePath === STALE_LEGACY_LINK),
    false,
    "a stale link from the old hand-maintained index must not be republished",
  );

  for (const document of documents) {
    assert.ok(document.title.length > 0, document.relativePath);
    assert.ok(document.href.startsWith("/ca/"), document.href);
    await access(path.join(process.cwd(), "public", "ca", document.relativePath));
  }
});

test("document inventory is deterministic and groups locale variants", async () => {
  const documents = await listCentralAuthorityDocuments();
  const sorted = [...documents].sort(
    (left, right) =>
      left.directory.localeCompare(right.directory) ||
      left.variantKey.localeCompare(right.variantKey) ||
      (left.sourceLocale ?? "").localeCompare(right.sourceLocale ?? "") ||
      left.filename.localeCompare(right.filename),
  );

  assert.deepEqual(documents, sorted);
  assert.ok(
    documents.some((document) => document.sourceLocale === "fr"),
    "expected at least one retained French document",
  );
});
