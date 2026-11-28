import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const configUrl = new URL("../next.config.mjs", import.meta.url);

test("Next applies baseline response hardening to native and legacy routes", async () => {
  const config = await readFile(configUrl, "utf8");

  assert.match(config, /poweredByHeader:\s*false/);
  assert.match(config, /source:\s*"\/:path\*"/);
  assert.match(config, /key:\s*"X-Frame-Options",\s*value:\s*"DENY"/);
  assert.match(
    config,
    /key:\s*"X-Content-Type-Options",\s*value:\s*"nosniff"/,
  );
  assert.match(
    config,
    /key:\s*"Referrer-Policy",\s*value:\s*"strict-origin-when-cross-origin"/,
  );
  assert.match(config, /key:\s*"Permissions-Policy"/);
  assert.match(config, /camera=\(\), microphone=\(\), geolocation=\(\)/);
});

test("CSP enforces safe primitives and only observes legacy script restrictions", async () => {
  const config = await readFile(configUrl, "utf8");
  assert.match(config, /key: "Content-Security-Policy", value: baselineCsp/);
  assert.match(config, /key: "Content-Security-Policy-Report-Only", value: candidateCsp/);
  const baseline = config.split("const baselineCsp = [")[1]?.split("].join")[0];
  assert.ok(baseline);
  assert.match(baseline, /object-src 'none'/);
  assert.match(baseline, /base-uri 'self'/);
  assert.match(baseline, /frame-ancestors 'none'/);
  assert.doesNotMatch(baseline, /script-src|style-src|unsafe-inline|https:/);
  assert.match(config, /script-src 'self'/);
  const reportOnly = config.split("const candidateCsp = [")[1]?.split("].join")[0];
  assert.ok(reportOnly);
  assert.doesNotMatch(reportOnly, /report-uri|report-to/);
});

test("ZAP 10055: report-only candidate never approves unsafe-inline or wildcard schemes", async () => {
  const config = await readFile(configUrl, "utf8");
  const baseline = config.split("const baselineCsp = [")[1]?.split("].join")[0] ?? "";
  const candidate = config.split("const candidateCsp = [")[1]?.split("].join")[0] ?? "";
  assert.ok(candidate);
  assert.match(config, /Content-Security-Policy-Report-Only/);
  assert.match(baseline, /object-src 'none'/);
  // Even the enforced baseline must remain safe for legacy JS/CSS during migration.
  assert.doesNotMatch(baseline, /script-src|style-src|default-src/);
  assert.match(candidate, /default-src 'self'/);
  assert.match(candidate, /form-action 'self'/);
  assert.match(candidate, /connect-src 'self'/);
  assert.match(candidate, /img-src 'self' data:/);
  assert.doesNotMatch(candidate, /unsafe-inline|unsafe-eval|unsafe-hashes/);
  assert.doesNotMatch(candidate, /https:\\?:|http:\\?:/);
  assert.doesNotMatch(candidate, /https:("|'|\s|$)/);
  assert.doesNotMatch(candidate, /report-uri|report-to/);
});

test("CORS remains fail-closed on Next config and the public sample API", async () => {
  const [config, api, notFound] = await Promise.all([
    readFile(configUrl, "utf8"),
    readFile(new URL("../api/hello.js", import.meta.url), "utf8"),
    readFile(new URL("../app/__legacy-html-not-found__/route.ts", import.meta.url), "utf8"),
  ]);
  for (const source of [config, api, notFound]) {
    assert.doesNotMatch(source, /Access-Control-Allow-Origin/i);
    assert.doesNotMatch(source, /Access-Control-Allow-Credentials/i);
  }
});
