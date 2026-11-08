/**
 * Fail-closed schema for the ONLY OpenRAG-related data permitted in a public
 * Next.js bundle. Never fetch OpenRAG from the browser.
 *
 * Private document names, object paths, hashes, chunks, extracted text, URLs,
 * authentication data, persons, and decision contents are deliberately excluded.
 */
const ENTRY_KEYS = [
  "assertionStatus", "datePrecision", "eventDate", "evidenceStatus", "id",
  "jurisdiction", "kind", "publicProofRefs", "reportedSince",
];
const PROOF_KEYS = ["claimIds", "id", "pages", "publicationStatus", "title"];
const LOCALES = ["fr", "en", "de", "no"];
const JURISDICTIONS = ["FR", "NO", "DE", "MULTI"];
const ENTRY_KINDS = ["complaint", "contact-request"];

function validKeys(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join("|") === [...keys].sort().join("|");
}

function reject(message) {
  throw new TypeError(`Invalid public evidence register: ${message}`);
}

function validReviewedDate(entry) {
  if (entry.datePrecision === "unknown") return entry.eventDate === null;
  if (entry.assertionStatus !== "document-reviewed" ||
      entry.evidenceStatus !== "reviewed-public-reference" ||
      !Array.isArray(entry.publicProofRefs) || entry.publicProofRefs.length === 0 ||
      typeof entry.eventDate !== "string") return false;
  const date = entry.eventDate;
  if (entry.datePrecision === "year") return /^20\d{2}$/.test(date);
  if (entry.datePrecision === "month") {
    return /^20\d{2}-(?:0[1-9]|1[0-2])$/.test(date);
  }
  if (entry.datePrecision === "exact" && /^20\d{2}-(?:0[1-9]|1[0-2])-\d{2}$/.test(date)) {
    const stamp = Date.parse(date + "T00:00:00Z");
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === date;
  }
  return false;
}

export function assertPublicEvidenceRegister(register) {
  if (!validKeys(register, ["schemaVersion", "visibility", "entries", "proofs"]) ||
      register.schemaVersion !== 1 ||
      register.visibility !== "public-metadata-only" ||
      !Array.isArray(register.entries) ||
      !Array.isArray(register.proofs)) reject("top-level schema");

  const ids = new Set();
  for (const entry of register.entries) {
    if (!validKeys(entry, ENTRY_KEYS) ||
        !/^NRE-CLAIM-(?:FR|NO|DE|CONTACT)-\d{3}$/.test(entry.id) ||
        !JURISDICTIONS.includes(entry.jurisdiction) ||
        entry.id.split("-")[2] !== (entry.jurisdiction === "MULTI" ? "CONTACT" : entry.jurisdiction) ||
        !ENTRY_KINDS.includes(entry.kind) ||
        (entry.kind === "contact-request") !== (entry.jurisdiction === "MULTI") ||
        !/^2017-03-31$/.test(entry.reportedSince) ||
        !validReviewedDate(entry) ||
        !["owner-reported", "document-reviewed"].includes(entry.assertionStatus) ||
        !["unlinked", "reviewed-public-reference"].includes(entry.evidenceStatus) ||
        !Array.isArray(entry.publicProofRefs) ||
        !entry.publicProofRefs.every(ref => typeof ref === "string" && /^NRE-PROOF-\d{4}$/.test(ref)) ||
        new Set(entry.publicProofRefs).size !== entry.publicProofRefs.length ||
        ids.has(entry.id)) reject("claim entry");
    ids.add(entry.id);
  }
  const proofIds = new Set();
  for (const proof of register.proofs) {
    if (!validKeys(proof, PROOF_KEYS) ||
        typeof proof.id !== "string" ||
        !/^NRE-PROOF-\d{4}$/.test(proof.id) ||
        proofIds.has(proof.id) ||
        proof.publicationStatus !== "request-only" ||
        !validKeys(proof.title, LOCALES) ||
        !LOCALES.every(locale => typeof proof.title[locale] === "string" &&
          proof.title[locale].trim().length >= 5 && proof.title[locale].length <= 120) ||
        !Array.isArray(proof.pages) ||
        !proof.pages.every(page => Number.isInteger(page) && page >= 1 && page <= 100000) ||
        !Array.isArray(proof.claimIds) ||
        !proof.claimIds.every(id => ids.has(id))) reject("public proof reference");
    proofIds.add(proof.id);
  }
  for (const entry of register.entries) {
    if (!entry.publicProofRefs.every(ref => proofIds.has(ref)) ||
        (entry.evidenceStatus === "reviewed-public-reference") !== (entry.publicProofRefs.length > 0)) {
      reject("unreviewed or dangling proof link");
    }
    if (!entry.publicProofRefs.every(ref =>
      register.proofs.some(proof => proof.id === ref && proof.claimIds.includes(entry.id)))) {
      reject("proof-to-claim mismatch");
    }
  }
  if (!register.proofs.every(proof => register.entries.some(
    entry => entry.publicProofRefs.includes(proof.id)))) {
    reject("orphan public proof reference");
  }
  return register;
}
