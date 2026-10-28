import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  auditRuntimeParity,
  LEGACY_SCRIPTS,
  scriptSources,
} from "../scripts/quality/homepage-runtime-parity.mjs";

const valid = () => ({
  legacyHtml: LEGACY_SCRIPTS.map(
    ({ src }) => `<script src="${src}" defer></script>`,
  ).join("\n"),
  previewPage:
    "export default async function HomePreview; robots: { index: false, follow: false }",
  localeLayout: '<Script src="/site-analytics.js" />',
  proxy: 'NextResponse.rewrite(new URL("/index.html", request.url))',
});

test("parses only script src attributes, including multiline tags", () => {
  assert.deepEqual(
    scriptSources(
      '<script type="application/ld+json">{}</script>\n<script\n defer src="/site-widgets.js" data-print-pdf></script>',
    ),
    ["/site-widgets.js"],
  );
});

test("documents every approved legacy script without forcing unnecessary dependencies into React", () => {
  const result = auditRuntimeParity(valid());
  assert.equal(result.ready, true);
  assert.deepEqual(result.pending, []);
  assert.deepEqual(result.retainedOnLegacy, [
    "translation",
    "d3",
    "arf",
    "status-widget",
  ]);
  assert.deepEqual(result.notRequiredInPreview, [
    "connection",
    "turnstile",
    "jquery",
    "popper",
    "bootstrap",
  ]);
  assert.equal(LEGACY_SCRIPTS.length, 15);
  assert.equal(
    result.retainedOnLegacy.length + result.notRequiredInPreview.length,
    9,
  );
  assert.ok(
    LEGACY_SCRIPTS.every(({ state }) =>
      ["partial", "legacy-retained", "not-required"].includes(state),
    ),
  );
  const documented = LEGACY_SCRIPTS.filter(({ state }) => state !== "partial");
  assert.ok(
    documented.every(
      ({ reason }) => typeof reason === "string" && reason.length > 30,
    ),
  );
});

test("fails closed on missing, new, or duplicate legacy scripts", () => {
  const fixture = valid();
  fixture.legacyHtml = `${fixture.legacyHtml.replace('<script src="arf.js" defer></script>', "")}<script src="/new-tracker.js"></script><script src="/site-widgets.js"></script>`;
  const result = auditRuntimeParity(fixture);
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing, ["arf.js"]);
  assert.deepEqual(result.unexpected, ["/new-tracker.js"]);
  assert.deepEqual(result.duplicates, ["/site-widgets.js"]);
});

test("keeps the legacy homepage and public nonindexable React review separate", () => {
  const fixture = valid();
  fixture.previewPage = "robots: { index: true, follow: true }";
  fixture.proxy = "";
  const result = auditRuntimeParity(fixture);
  assert.equal(result.ready, false);
  assert.equal(result.gates.previewReviewAvailable, false);
  assert.equal(result.gates.previewNoIndex, false);
  assert.equal(result.gates.legacyHomepage, false);
});

test("does not silently insert third-party legacy scripts in the preview", () => {
  const fixture = valid();
  fixture.previewPage +=
    '<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />';
  const result = auditRuntimeParity(fixture);
  assert.equal(result.ready, false);
  assert.equal(result.gates.noLegacyScriptsInPreview, false);
});

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("retained D3/ARF visualization stays reachable via the legacy route", () => {
  const preview = read("app/[locale]/home-preview/page.tsx");
  const links = read("components/home/LegacyPeopleSection.tsx");
  const legacy = read("public/people-contacted.html");
  assert.match(preview, /<LegacyPeopleSection\s*\/>/);
  assert.match(links, /href="\/people-contacted\.html"/);
  assert.match(legacy, /id="arf-viz-body"/);
  assert.match(legacy, /src="d3\.v3\.min\.js"/);
  assert.match(legacy, /src="arf\.js"/);
});

test("retired legacy libraries do not disguise missing forms or new trackers", () => {
  const stub = read("public/obs-connection.js");
  const contact = read("components/home/LegacyContactSection.tsx");
  const disclosure = read("components/home/LegacyDisclosureSection.tsx");
  const preview = read("app/[locale]/home-preview/page.tsx");
  assert.match(stub, /Placeholder for optional Obs/);
  assert.match(stub, /void 0;/);
  assert.match(contact, /href="mailto:/);
  assert.doesNotMatch(contact, /<form\b|<input\b/);
  assert.match(disclosure, /<details\b/);
  assert.match(disclosure, /<summary\b/);
  assert.doesNotMatch(
    preview,
    /jquery|popper|bootstrap|turnstile|betterstack/i,
  );
});
