import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
  new URL("../.github/workflows/production-dast.yml", import.meta.url),
  "utf8",
);

test("Vercel HTTP 402 fails the preflight before ZAP and preserves a failure status", () => {
  const preflight = workflow.indexOf("      - name: Verify production DAST access");
  const scanner = workflow.indexOf("      - name: Run OWASP ZAP baseline", preflight);
  assert.ok(preflight !== -1, "production access preflight is mandatory");
  assert.ok(scanner > preflight, "ZAP cannot run before platform preflight");
  const guard = workflow.slice(preflight, scanner);
  assert.match(guard, /if \[\[ "\$status" == "402" \]\]; then/);
  assert.match(guard, /DAST_BLOCKER=vercel-http-402/);
  assert.match(guard, /VERCEL_DAST_HTTP_402/);
  assert.match(guard, /exit 1/);
  assert.match(workflow, /if \[\[ "\$DAST_BLOCKER" == "vercel-http-402" \]\]; then\s+STATE=failure/);
  assert.match(workflow, /DESCRIPTION="Production DAST blocked: Vercel HTTP 402"/);
});

test("Vercel 429 or challenge blocks scanning rather than becoming a finding", () => {
  assert.match(workflow, /"\$status" == "429"/);
  assert.match(workflow, /x-vercel-mitigated/);
  assert.match(workflow, /DAST_BLOCKER=vercel-waf-challenge/);
  assert.match(workflow, /ZAP_WAF_PREFLIGHT_BLOCK/);
});
