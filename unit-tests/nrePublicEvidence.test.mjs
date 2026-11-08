import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertPublicEvidenceRegister } from "../lib/nrePublicEvidence.mjs";

const root = new URL("../", import.meta.url);
const load = path => readFileSync(new URL(path, root), "utf8");
const publicRegistry = JSON.parse(load("data/nre-evidence.public.json"));
const copyRegistry = () => structuredClone(publicRegistry);

test("NRE register publishes declarations without leaking document metadata", () => {
  assert.equal(assertPublicEvidenceRegister(publicRegistry), publicRegistry);
  assert.equal(publicRegistry.visibility, "public-metadata-only");
  assert.equal(publicRegistry.entries.length, 4);
  assert.equal(publicRegistry.proofs.length, 0);
  assert.deepEqual(publicRegistry.entries.map(row => row.jurisdiction).sort(), [
    "DE", "FR", "MULTI", "NO",
  ]);
  for (const entry of publicRegistry.entries) {
    assert.equal(entry.assertionStatus, "owner-reported");
    assert.equal(entry.eventDate, null);
    assert.equal(entry.datePrecision, "unknown");
    assert.equal(entry.evidenceStatus, "unlinked");
    assert.deepEqual(entry.publicProofRefs, []);
    assert.equal(entry.reportedSince, "2017-03-31");
  }
  assert.doesNotMatch(JSON.stringify(publicRegistry),
    /(?:originalObjectKey|originalSha256|bearer|privatePath|documentText|openragUrl|credentials|apiKey)/i);
});

test("unknown properties and missing document approval cannot enter the public register", () => {
  const unknown = copyRegistry();
  unknown.entries[0].privatePath = "/private/example.pdf";
  assert.throws(() => assertPublicEvidenceRegister(unknown), TypeError);

  const fakeProofRef = copyRegistry();
  fakeProofRef.entries[1].publicProofRefs.push("NRE-PROOF-0001");
  assert.throws(() => assertPublicEvidenceRegister(fakeProofRef), TypeError);

  const invalidDate = copyRegistry();
  invalidDate.entries[1].eventDate = "2023-01-01";
  assert.throws(() => assertPublicEvidenceRegister(invalidDate), TypeError);

  const rogueTopLevel = { ...copyRegistry(), openragEndpoint: "https://private.invalid" };
  assert.throws(() => assertPublicEvidenceRegister(rogueTopLevel), TypeError);

  const extraProof = copyRegistry();
  extraProof.proofs.push({
    id: "NRE-PROOF-0001",
    claimIds: ["NRE-CLAIM-FR-001"],
    title: { fr: "Pièce française", en: "French record", de: "Französische Akte", no: "Fransk dokument" },
    pages: [1],
    publicationStatus: "request-only",
    originalUrl: "https://example.invalid/raw.pdf",
  });
  extraProof.entries[1].evidenceStatus = "reviewed-public-reference";
  extraProof.entries[1].publicProofRefs.push("NRE-PROOF-0001");
  assert.throws(() => assertPublicEvidenceRegister(extraProof), TypeError);
});

test("approved public proof references are one-to-one linked and never raw documents", () => {
  const reviewed = copyRegistry();
  reviewed.proofs.push({
    id: "NRE-PROOF-0001",
    claimIds: ["NRE-CLAIM-FR-001"],
    title: {
      fr: "Référence publique caviardée",
      en: "Redacted public reference",
      de: "Öffentliche gekürzte Referenz",
      no: "Sladdet offentlig referanse",
    },
    pages: [1, 2],
    publicationStatus: "request-only",
  });
  reviewed.entries[1].evidenceStatus = "reviewed-public-reference";
  reviewed.entries[1].publicProofRefs.push("NRE-PROOF-0001");
  assert.equal(assertPublicEvidenceRegister(reviewed), reviewed);

  // Synthetic leap-day fixture only — NOT a real case date.
  const dated = structuredClone(reviewed);
  dated.entries[1].eventDate = "2024-02-29";
  dated.entries[1].datePrecision = "exact";
  dated.entries[1].assertionStatus = "document-reviewed";
  assert.equal(assertPublicEvidenceRegister(dated), dated);
  dated.entries[1].eventDate = "2024-02-30";
  assert.throws(() => assertPublicEvidenceRegister(dated), TypeError);

  const mismatch = structuredClone(reviewed);
  mismatch.proofs[0].claimIds = ["NRE-CLAIM-NO-001"];
  assert.throws(() => assertPublicEvidenceRegister(mismatch), TypeError);
});

test("NRE UI only advertises the safe contact route and public proof identifiers", () => {
  const ui = load("app/[locale]/nre/NreEvidenceRegister.tsx");
  const page = load("app/[locale]/nre/page.tsx");
  assert.match(page, /<NreEvidenceRegister /);
  assert.match(ui, /assertPublicEvidenceRegister/);
  assert.match(ui, /\/contact#contact-details/);
  assert.match(ui, /publicProofRefs/);
  assert.doesNotMatch(ui, /fetch\(|OPENRAG_|NEXT_PUBLIC_|api\/openrag|presigned|rawDocument/);
});

test("every native locale has the exact same evidence registry translation contract", () => {
  const locales = ["fr", "en", "de", "no"];
  const translations = locales.map(locale =>
    JSON.parse(load(`messages/nre/${locale}.json`)).nrePage.register);
  const keys = Object.keys(translations[0]).sort();
  assert.ok(keys.length >= 15);
  for (const translation of translations) {
    assert.deepEqual(Object.keys(translation).sort(), keys);
    assert.ok(Object.values(translation).every(
      val => typeof val === "string" && val.length >= 6));
  }
});
