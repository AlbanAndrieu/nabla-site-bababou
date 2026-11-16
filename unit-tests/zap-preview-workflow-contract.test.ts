import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/zap-preview.yml",
  import.meta.url,
);

test("ZAP scans only exact Vercel Preview checkpoint deployments", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /base_url:/);
  assert.match(workflow, /git_sha:/);
  assert.match(workflow, /preview_ref:/);
  assert.match(workflow, /vercel\.deployment\.success/);
  assert.match(workflow, /vercel-preview-pr-/);
  assert.match(workflow, /environment != 'production'/);
  assert.match(workflow, /git\.ref != 'master'/);
  assert.match(workflow, /github\.event\.client_payload\.url/);
  assert.match(workflow, /github\.event\.client_payload\.git\.sha/);
  assert.match(workflow, /github\.rest\.git\.getRef/);
  assert.match(workflow, /checkpoint\.object\.sha !== process\.env\.DEPLOYED_SHA/);
  assert.match(workflow, /\.vercel\.app/);

  assert.doesNotMatch(workflow, /www\.bababou\.com/);
  assert.doesNotMatch(workflow, /bababou\.com/);
  assert.doesNotMatch(workflow, /localhost|127\.0\.0\.1/);
});

test("ZAP checks out the exact deployed policy before scanning", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  const verify = workflow.indexOf("Verify Preview checkpoint exact SHA");
  const checkout = workflow.indexOf("Checkout exact deployed ZAP policy");
  const scan = workflow.indexOf("Run OWASP ZAP baseline against Vercel Preview");

  assert.ok(verify >= 0);
  assert.ok(checkout > verify);
  assert.ok(scan > checkout);
  assert.match(
    workflow,
    /actions\/checkout@d23441a48e516b6c34aea4fa41551a30e30af803/,
  );
  assert.match(workflow, /ref: \$\{\{ env\.DEPLOYED_SHA \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /sparse-checkout:[\s\S]*\.zap\/rules\.tsv/);
  assert.match(workflow, /sparse-checkout-cone-mode: false/);
});

test("ZAP negotiates Vercel Automation Bypass or OIDC and scopes the selected header to the scanner", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /core\.getIDToken/);
  assert.match(workflow, /x-vercel-protection-bypass/);
  assert.match(workflow, /x-vercel-trusted-oidc-idp-token/);
  assert.match(
    workflow,
    /Neither Vercel Automation Bypass nor GitHub Actions OIDC/,
  );
  assert.match(workflow, /ZAP_AUTH_HEADER_SITE=/);
  assert.match(workflow, /x-vercel-mitigated/);
  assert.match(workflow, /Vercel Security Checkpoint/);
});

test("ZAP baseline is isolated and never uploads raw scan evidence", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.doesNotMatch(workflow, /zaproxy\/action-baseline/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact/);
  assert.doesNotMatch(workflow, /artifact_name:/);
  assert.match(workflow, /ghcr\.io\/zaproxy\/zaproxy:2\.17\.0/);
  assert.match(workflow, /docker run --rm/);
  assert.doesNotMatch(workflow, /--user "\$\(id -u\):\$\(id -g\)"/);
  assert.doesNotMatch(workflow, /--env HOME=\/tmp/);
  assert.match(workflow, /sudo chgrp 1000 "\$scan_dir"/);
  assert.match(workflow, /chmod 0770 "\$scan_dir"/);
  assert.match(workflow, /ZAP_RUNTIME_PREFLIGHT_FAILED/);

  assert.match(workflow, /--env ZAP_AUTH_HEADER --env ZAP_AUTH_HEADER_VALUE --env ZAP_AUTH_HEADER_SITE/);
  assert.match(workflow, /zap-baseline\.py -t "\$PREVIEW_BASE_URL" -c rules\.tsv/);
  assert.match(workflow, /-J report_json\.json -I -T 5 -s/);
  assert.match(workflow, /continue-on-error: true/);
  assert.match(workflow, /ZAP_SCAN_DIR=/);
  assert.match(workflow, /report_json\.json/);
  assert.match(workflow, /runner-local only/);
  assert.doesNotMatch(workflow, /Top alert types/);
  assert.match(workflow, /Clean ZAP Preview workspace/);
  assert.match(workflow, /Enforce ZAP Preview policy/);
  assert.match(workflow, /scanner\/configuration error, not a security finding/);
  assert.match(workflow, /context 'OWASP ZAP Preview'/);
  assert.match(workflow, /statuses: write/);
  assert.match(workflow, /ZAP Preview access preflight failed/);
  assert.match(workflow, /ZAP Preview passed \$counts/);
  assert.match(workflow, /ZAP Preview scanner failed or invalid report/);
  assert.match(workflow, /ZAP_NO_REPORT class=\$category/);
  assert.match(workflow, /ZAP_INVALID_REPORT/);
  assert.match(workflow, /ZAP_SCANNER_ERROR/);
  assert.match(workflow, /ZAP_SCAN_EXIT_CODE=\$zap_exit/);
  assert.match(workflow, /\.site \| type == "array"/);
  assert.match(workflow, /zap-startup/);
  assert.match(workflow, /docker-image/);
  assert.match(workflow, /ZAP Preview blocked \$counts/);
});

test("Production ZAP distinguishes scanner failure from policy findings and requires sanitized SARIF", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/production-dast.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /PRODUCTION_ZAP_NO_REPORT class=\$category/);
  assert.match(workflow, /PRODUCTION_ZAP_INVALID_REPORT/);
  assert.match(workflow, /PRODUCTION_ZAP_SCANNER_ERROR/);
  assert.match(workflow, /ZAP_SCAN_EXIT_CODE=\$zap_exit/);
  assert.match(workflow, /\.site \| type == "array"/);
  assert.match(workflow, /SAFE_REPORT_OUTCOME/);
  // ZAP exits 1/2 on findings; only verified, sanitized SARIF is exported.
  assert.match(workflow, /env\.ZAP_SCAN_EXIT_CODE == '1'/);
  assert.match(workflow, /env\.ZAP_SCAN_EXIT_CODE == '2'/);
  assert.match(workflow, /if: steps\.safe-report\.outcome == 'success'/);
  assert.match(workflow, /SAFE_UPLOAD_OUTCOME/);
  assert.match(workflow, /Production ZAP scanner failed or invalid report/);
  assert.match(workflow, /zap-production-safe\.sarif/);
  assert.doesNotMatch(workflow, /zaproxy\/action-baseline/);
  assert.doesNotMatch(workflow, /cat "\$scan_dir\/console\.log"/);
});

test("production and Preview ZAP use the pinned image non-root identity without exposing private scan files", async () => {
  for (const workflowPath of ["production-dast.yml", "zap-preview.yml"]) {
    const workflow = await readFile(new URL("../.github/workflows/" + workflowPath, import.meta.url), "utf8");
    assert.match(workflow, /ghcr\.io\/zaproxy\/zaproxy:2\.17\.0/);
    assert.match(workflow, /sudo chgrp 1000 "\$scan_dir"/);
    assert.match(workflow, /chmod 0770 "\$scan_dir"/);
    assert.match(workflow, /chmod 0644 "\$scan_dir\/rules\.tsv"/);
    assert.match(workflow, /test -w "\$HOME" && test -w \/zap\/wrk/);
    assert.match(workflow, /ZAP_RUNTIME_PREFLIGHT_FAILED/);
    assert.doesNotMatch(workflow, /--user "\$\(id -u\):\$\(id -g\)"/);
    assert.doesNotMatch(workflow, /--env HOME=\/tmp/);
    assert.doesNotMatch(workflow, /chmod (?:0777|777)/);
    assert.doesNotMatch(workflow, /cat "\$scan_dir\/console\.log"/);
    assert.match(workflow, /-J report_json\.json -I -T 5 -s/);
    assert.match(workflow, /--env ZAP_AUTH_HEADER --env ZAP_AUTH_HEADER_VALUE --env ZAP_AUTH_HEADER_SITE/);
  }
});
