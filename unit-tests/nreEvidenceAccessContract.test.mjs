import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const locales = ["fr", "en", "de", "no"];
const publicRegister = JSON.parse(read("data/nre-evidence.public.json"));

test("the explanatory route is native Next, localized, canonical and has one main landmark", () => {
  const page = read("app/[locale]/evidence-access/page.tsx");
  const route = read("lib/mainContentRoute.mjs");
  const catalog = read("lib/sitePageCatalog.ts");
  assert.match(page, /<main id="main-content"/);
  assert.match(page, /generateStaticParams/);
  assert.match(page, /dynamic = "force-static"/);
  assert.match(page, /pageAlternates\("evidence-access"/);
  assert.match(page, /images: \[\]/);
  assert.match(page, /assertPublicEvidenceRegister\(publicRegister\)/);
  assert.match(route, /"evidence-access"/);
  assert.match(catalog, /"evidence-access": \{/);
  assert.doesNotMatch(page, /fetch\(|process\.env|iframe|<form|NEXT_PUBLIC_.*KEY/);
});

test("four languages have exact access-copy parity and a prepared anchor for every claim", () => {
  const objects = locales.map(lang => JSON.parse(read("messages/nre/" + lang + ".json")).nrePage);
  const keys = Object.keys(objects[0].access).sort();
  for (const obj of objects) {
    assert.deepEqual(Object.keys(obj.access).sort(), keys);
    assert.ok(keys.length >= 30);
    assert.ok(Object.values(obj.access).every(value =>
      typeof value === "string" && value.trim().length >= 8));
    assert.ok(obj.register.openRecord);
    assert.ok(obj.register.accessGuide);
  }
  const page = read("app/[locale]/evidence-access/page.tsx");
  const cards = read("app/[locale]/nre/NreEvidenceRegister.tsx");
  assert.match(page, /id=\{entry\.id\}/);
  assert.match(page, /id=\{proof\.id\}/);
  assert.match(cards, /guideHref/);
  assert.match(cards, /#\$\{entry\.id\}/);
  assert.match(cards, /#\$\{ref\}/);
  assert.equal(publicRegister.proofs.length, 0);
});

test("Cloudflare Access template is opt-in and prohibits world-readable access", () => {
  const policy = read("infra/cloudflare/nre-evidence-access.tf");
  const docs = read("infra/cloudflare/README.md");
  for (const required of [
    'variable "nre_access_enabled"', 'default     = false',
    'approval_required              = true',
    'purpose_justification_required = true',
    'session_duration = "15m"',
    'session_duration       = "0m"',
    'allowed_authenticators = ["security_key", "totp"]',
    'cloudflare_zero_trust_access_application',
    'nre_approved_requester_emails',
    'nre_approver_emails',
  ]) assert.ok(policy.includes(required), required);
  assert.doesNotMatch(policy, /everyone\s*=|bypass|login_method\s*=|allow_all_origins\s*=\s*true/i);
  assert.ok(docs.includes("Protect with Access"));
});

test("no evidence gateway or private document origin is linked in public UI", () => {
  const page = read("app/[locale]/evidence-access/page.tsx");
  const registry = read("app/[locale]/nre/NreEvidenceRegister.tsx");
  for (const s of [page, registry]) {
    assert.doesNotMatch(s, /cloudflarestorage|OPENRAG_API_KEY|originalObjectKey|presigned/i);
    assert.doesNotMatch(s, /https:\/\/[^"]+\/(?:evidence|private)\/NRE-PROOF-/);
  }
  assert.ok(page.includes("t.pending"));
  assert.ok(page.includes("t.noApprovedProofs"));
});

test("public document overview displays only declared entries, not actual complaints or received requests", () => {
  const page = read("app/[locale]/evidence-access/page.tsx");
  const css = read("app/[locale]/nre/page.module.css");
  assert.match(page, /data-testid="evidence-public-overview"/);
  for (const expr of [
    /entries\.length/,
    /entries\.filter\(entry => entry\.evidenceStatus === "unlinked"\)\.length/,
    /proofs\.length/,
    /entries\.filter\(entry => entry\.kind === "contact-request"\)\.length/,
  ]) assert.match(page, expr);
  assert.match(page, /t\.overviewIntro/);
  assert.match(page, /href="#request-documents"/);
  assert.match(css, /\.accessOverviewCards/);
  assert.match(css, /max-width: 420px/);
  assert.doesNotMatch(page, /(?:fetch\(|openrag|privateObjectKey|receivedRequestsCount|caseNumber)/i);
  assert.equal(publicRegister.entries.length, 4);
  assert.equal(publicRegister.proofs.length, 0);
  for (const lang of locales) {
    const words = JSON.parse(read("messages/nre/" + lang + ".json")).nrePage.access;
    for (const field of ["overviewHeading", "overviewIntro", "overviewEntries",
      "overviewPending", "overviewProofs", "overviewContact"]) {
      assert.ok(typeof words[field] === "string" && words[field].trim().length >= 8);
    }
  }
});
