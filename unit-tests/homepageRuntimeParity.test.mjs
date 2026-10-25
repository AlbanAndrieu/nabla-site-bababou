import assert from "node:assert/strict";
import test from "node:test";
import { auditRuntimeParity, LEGACY_SCRIPTS, scriptSources } from "../scripts/quality/homepage-runtime-parity.mjs";

const valid = () => ({
  legacyHtml: LEGACY_SCRIPTS.map(({ src }) => '<script src="' + src + '" defer></script>').join("\n"),
  previewPage: 'export default async function HomePreview; "true"; robots: { index: false, follow: false }',
  localeLayout: '<Script src="/site-analytics.js" />',
  proxy: 'NextResponse.rewrite(new URL("/index.html", request.url))',
});

test("parses only script src attributes, including multiline tags", () => {
  assert.deepEqual(scriptSources('<script type="application/ld+json">{}</script>\n<script\n defer src="/site-widgets.js" data-print-pdf></script>'), ["/site-widgets.js"]);
});

test("recognizes the approved script inventory but does not claim finished parity", () => {
  const result = auditRuntimeParity(valid());
  assert.equal(result.ready, true);
  assert.ok(result.pending.includes("d3"));
  assert.ok(result.pending.includes("arf"));
  assert.ok(result.pending.includes("turnstile"));
  assert.ok(result.pending.includes("translation"));
});

test("fails closed on missing, new, or duplicate legacy scripts", () => {
  const fixture = valid();
  fixture.legacyHtml = fixture.legacyHtml.replace('<script src="arf.js" defer></script>', '') + '<script src="/new-tracker.js"></script><script src="/site-widgets.js"></script>';
  const result = auditRuntimeParity(fixture);
  assert.equal(result.ready, false);
  assert.deepEqual(result.missing, ["arf.js"]);
  assert.deepEqual(result.unexpected, ["/new-tracker.js"]);
  assert.deepEqual(result.duplicates, ["/site-widgets.js"]);
});

test("keeps the approved homepage route, public noindex preview and noindex", () => {
  const fixture = valid();
  fixture.previewPage = 'robots: { index: true, follow: true }';
  fixture.proxy = '';
  const result = auditRuntimeParity(fixture);
  assert.equal(result.ready, false);
  assert.equal(result.gates.previewReviewAvailable, false);
  assert.equal(result.gates.previewNoIndex, false);
  assert.equal(result.gates.legacyHomepage, false);
});

test("does not silently insert third-party legacy scripts in the preview", () => {
  const fixture = valid();
  fixture.previewPage += '<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />';
  const result = auditRuntimeParity(fixture);
  assert.equal(result.ready, false);
  assert.equal(result.gates.noLegacyScriptsInPreview, false);
});
