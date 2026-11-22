import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const load = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const production = load(".github/workflows/production-dast.yml");
const preview = load(".github/workflows/zap-preview.yml");
const playwright = load(".github/workflows/playwright.yml");
const smoke = load("scripts/verify-production-live.sh");

const mitigationGuard =
  'if [[ "$status" == "429" || ( -n "$mitigated" && "${mitigated,,}" != "none" ) ]]; then';

test("DAST production blocks every explicit Vercel mitigation before authentication fallback", () => {
  assert.ok(production.includes(mitigationGuard));
  assert.match(production, /DAST_BLOCKER=vercel-waf-challenge/);
  assert.match(production, /ZAP_WAF_PREFLIGHT_BLOCK/);
  assert.ok(production.indexOf(mitigationGuard) < production.indexOf('if grep -Eiq'));
  assert.ok(production.includes('mitigated=none'), "No attacker-controlled header in GitHub outputs");
  assert.doesNotMatch(production, /echo "mitigated=\$\{mitigated:-none\}"/);
});

test("ZAP Preview fails closed on quota and mitigation before trying another bypass", () => {
  assert.ok(preview.includes(mitigationGuard));
  assert.match(preview, /ZAP_VERCEL_HTTP_402/);
  assert.match(preview, /ZAP_WAF_PREFLIGHT_BLOCK/);
  const guard = preview.indexOf('if [[ "$status" == "402" ]]');
  const mitigated = preview.indexOf(mitigationGuard);
  assert.ok(guard >= 0 && guard < mitigated);
  assert.ok(preview.includes('echo "mitigated=$([[ -n "$mitigated"'));
  assert.doesNotMatch(preview, /echo "mitigated=\$\{mitigated:-none\}"/);
});

test("Playwright Preview rejects quota, WAF interception and 5xx before browser tests", () => {
  assert.equal(playwright.split(mitigationGuard).length - 1, 2);
  assert.match(playwright, /PLAYWRIGHT_VERCEL_HTTP_402/);
  assert.match(playwright, /Preview unavailable/);
  assert.match(playwright, /if \[\[ ! "\$status" =~ \^\[23\]\[0-9\]\[0-9\]\$ \]\]; then/);
  assert.doesNotMatch(playwright, /x-vercel-mitigated=\$\{mitigated:-unknown\}/);
});

test("Production live smoke explicitly classifies Vercel 402 and all mitigations", () => {
  assert.match(smoke, /PROD_LIVE_PLATFORM_BLOCKED/);
  assert.match(smoke, /PROD_LIVE_CHECKPOINT/);
  assert.match(smoke, /"\$status" == "429"/);
  assert.match(smoke, /"\$\{mitigated,,\}" != "none"/);
  assert.doesNotMatch(smoke, /x-vercel-mitigated=\$\{mitigated/);
});
