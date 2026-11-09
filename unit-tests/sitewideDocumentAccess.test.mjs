import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  documentLinkIdentity,
  documentRequestPath,
  publicDocumentLocator,
  DOCUMENT_REQUEST_LABELS,
} from "../public/document-access-links.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("site-wide document detection is precise and preserves existing public source links", () => {
  const home = "https://www.bababou.com/abduction-norway.html";
  assert.equal(documentLinkIdentity("/ca/archive/example.pdf?signature=SECRET#page=1", home),
    "https://bababou.com/ca/archive/example.pdf");
  assert.equal(documentLinkIdentity("../private/case.docx", home),
    "https://bababou.com/private/case.docx");
  assert.equal(documentLinkIdentity("https://docs.google.com/document/d/123456789/edit", home),
    "https://docs.google.com/document/d/123456789/edit");
  assert.equal(documentLinkIdentity("/ca/demande-explications-autorites-competentes-fr.html", home),
    "https://bababou.com/ca/demande-explications-autorites-competentes-fr.html");
  assert.equal(documentLinkIdentity("https://example.org/report.html", home), null);
  assert.equal(documentLinkIdentity("https://example.org/report.html", home, true),
    "https://example.org/report.html");
  assert.equal(documentLinkIdentity("https://example.org/about", home), null);
  assert.equal(documentLinkIdentity("javascript:alert(1)", home), null);
  assert.equal(documentLinkIdentity("data:text/plain,secret", home), null);
  assert.equal(documentLinkIdentity("mailto:someone@example.com", home), null);
});

test("request locators are stable across preview/production and never include the source URL", () => {
  const prod = documentLinkIdentity("/assets/illustration.pdf?token=A", "https://bababou.com/nre");
  const preview = documentLinkIdentity("/assets/illustration.pdf?token=B",
    "https://nabla-site-bababou-preview.vercel.app/nre");
  assert.equal(prod, preview);
  const ref = publicDocumentLocator(prod);
  assert.match(ref, /^SITE-DOC-[0-9a-f]{16}$/);
  for (const lang of ["fr", "en", "de", "no"]) {
    const href = documentRequestPath(prod, lang);
    assert.ok(href.includes(`?doc=${ref}#request-documents`));
    assert.doesNotMatch(href, /token|assets|illustration|https:\/\//i);
  }
  assert.equal(publicDocumentLocator("not a valid URL"), null);
  assert.equal(documentRequestPath("invalid", "fr"), null);
});

test("client enhancer and the public guide have zero direct private backend dependencies", () => {
  const script = read("public/document-access-links.mjs");
  const widgets = read("public/site-widgets.js");
  const layout = read("app/[locale]/layout.tsx");
  const page = read("app/[locale]/evidence-access/page.tsx");
  const selection = read("app/[locale]/evidence-access/DocumentRequestSelection.tsx");
  assert.match(widgets, /document-access-links\.mjs/);
  assert.match(layout, /src="\/document-access-links\.mjs"/);
  assert.match(script, /MutationObserver/);
  assert.match(script, /data-document-access-ref/);
  assert.match(script, /documentRequestPath/);
  assert.match(page, /<DocumentRequestSelection /);
  assert.match(selection, /PUBLIC_DOCUMENT_REF/);
  assert.doesNotMatch(script + selection, /OPENRAG_API_KEY|NEXT_PUBLIC_.*KEY|privateObjectKey|\bfetche?\(/i);
});

test("request labels exist for each supported locale and do not imply automatic approval", () => {
  assert.deepEqual(Object.keys(DOCUMENT_REQUEST_LABELS).sort(), ["de", "en", "fr", "no"]);
  for (const locale of ["fr", "en", "de", "no"]) {
    const messages = JSON.parse(read(`messages/nre/${locale}.json`)).nrePage.access;
    for (const field of ["sitewideHeading", "sitewideIntro", "sitewideReference",
      "sitewideInstructions", "sitewideWithoutReference", "sitewidePublicNotice"]) {
      assert.ok(messages[field]?.length > 20, locale + "." + field);
    }
  }
});

test("legacy pages without shared widgets explicitly load the enhancer; 404 stays untouched", () => {
  for (const file of [
    "public/contact.html", "public/policy/legal.html",
    "public/policy/privacy_policy.html", "public/policy/service_terms.html",
  ]) assert.match(read(file), /type="module" src="\/document-access-links\.mjs"/);
  assert.doesNotMatch(read("public/404.html"), /document-access-links\.mjs/);
});

test("site-wide locators are useful offline and never confer permissions", () => {
  const resolver = read("scripts/resolve-site-document-ref.mjs");
  assert.match(resolver, /documentLinkIdentity/);
  assert.match(resolver, /publicDocumentLocator/);
  assert.doesNotMatch(resolver, /https\.request|\bfetche?\(|Authorization|OPENRAG_/);
  const architecture = read("docs/nre-evidence-openrag-access.md");
  assert.match(architecture, /approbation/i);
  assert.match(architecture, /ACL/);
});
