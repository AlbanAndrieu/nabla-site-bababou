import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/production-dast.yml", import.meta.url), "utf8");

test("Vercel HTTP 402 stops further authorization attempts and fails closed before ZAP", () => {
  const first = workflow.indexOf('if [[ "$status" == "402" ]]; then');
  const fallback = workflow.indexOf('"GitHub Actions OIDC trusted source"');
  assert.ok(first > 0 && fallback > first, "402 must precede OIDC fallback");
  assert.match(workflow, /DAST_BLOCKER=vercel-http-402/);
  assert.match(workflow, /VERCEL_DAST_HTTP_402/);
  assert.match(workflow, /if \[\[ "\$DAST_BLOCKER" == "vercel-http-402" \]\]; then\s+STATE=failure/);
  assert.match(workflow, /DESCRIPTION="Production DAST blocked: Vercel HTTP 402"/);
  assert.match(workflow, /exit 1/);
  assert.match(workflow, /zap-baseline\.py/);
});
