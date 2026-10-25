import assert from "node:assert/strict";
import test from "node:test";
import {
  auditPreviewLinks,
  auditRepositoryPreview,
} from "../scripts/quality/homepage-preview-links.mjs";

function fixture() {
  return {
    page: '<main id="main-content"><a href="#preview-contact">Contact</a><a href="/feed.xml">RSS</a></main>',
    sectionSources: [
      '<section id="preview-contact" aria-labelledby="contact-heading"><h2 id="contact-heading">Contact</h2></section>',
    ],
    publicExists: (href) => href === "/feed.xml",
  };
}

test("approved homepage preview has one target for local anchors and aria references", () => {
  const result = auditRepositoryPreview();
  assert.deepEqual(result.issues, []);
  assert.equal(result.auditedSections, 13);
  assert.ok(result.anchorCount > 0);
  assert.ok(result.labelReferences > 0);
});

test("fixture validates approved local navigation without third-party requests", () => {
  const result = auditPreviewLinks(fixture());
  assert.deepEqual(result.issues, []);
  assert.equal(result.publicAssetLinks, 1);
});

test("duplicate IDs and missing fragment targets are rejected", () => {
  const input = fixture();
  input.sectionSources.push('<aside id="main-content" aria-labelledby="missing-heading"></aside>');
  const result = auditPreviewLinks(input);
  assert.ok(result.issues.some((issue) => issue.includes("DUPLICATE_ID")));
  assert.ok(result.issues.some((issue) => issue.includes("MISSING_TARGET")));
});

test("missing approved static assets fail closed", () => {
  const input = fixture();
  input.publicExists = () => false;
  assert.ok(auditPreviewLinks(input).issues.some((issue) => issue.includes("MISSING_PUBLIC_ASSET")));
});

test("path traversal and protocol-relative paths cannot be treated as public assets", () => {
  const input = fixture();
  input.page += '<a href="/../private.txt">bad</a><a href="//example.com/tracker.js">bad</a>';
  assert.equal(auditPreviewLinks(input).issues.filter((issue) => issue === "INVALID_PUBLIC_HREF").length, 2);
});

test("missing main landmark and broken aria-labelledby are errors", () => {
  const input = fixture();
  input.page = '<div id="empty"><a href="#missing">Broken</a></div>';
  const result = auditPreviewLinks(input);
  assert.ok(result.issues.includes("MISSING_MAIN_LANDMARK"));
  assert.ok(result.issues.includes("MISSING_TARGET: missing"));
});

test("a card destination without a page target fails the real audit", () => {
  const input = fixture();
  input.dynamicHrefs = ["#missing-gallery-target"];
  const result = auditPreviewLinks(input);
  assert.ok(result.issues.includes("MISSING_TARGET: missing-gallery-target"));
});
