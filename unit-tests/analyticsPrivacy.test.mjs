import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../public/site-analytics.js", import.meta.url), "utf8");

test("PostHog browser collection masks sensitive content and disables replay", () => {
  assert.match(source, /disable_session_recording:\s*true/);
  assert.match(source, /mask_all_text:\s*true/);
  assert.match(source, /mask_all_element_attributes:\s*true/);
  assert.match(source, /person_profiles:\s*["']identified_only["']/);
});

test("Datadog RUM does not record sensitive family sessions", () => {
  assert.match(source, /sessionReplaySampleRate:\s*0/);
  assert.match(source, /defaultPrivacyLevel:\s*["']mask["']/);
});

test("business telemetry is explicit opt-in with fixed event and property allowlists", () => {
  assert.match(source, /data-posthog-business-events/);
  assert.match(source, /catalog_loaded:/);
  assert.match(source, /catalog_load_failed:/);
  assert.match(source, /diagnostics_unlock_failed:/);
  assert.match(source, /skipRemoteAnalyticsOnLocalDev\(\)/);
  assert.match(source, /Object\.prototype\.hasOwnProperty\.call\(BUSINESS_EVENTS, name\)/);
  assert.match(source, /Number\.isInteger\(value\)/);
});
