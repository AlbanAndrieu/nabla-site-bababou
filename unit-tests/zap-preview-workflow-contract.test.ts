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

test("ZAP uses the Vercel automation bypass inside the scanner container", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /ZAP_AUTH_HEADER: x-vercel-protection-bypass/);
  assert.match(
    workflow,
    /ZAP_AUTH_HEADER_VALUE: \$\{\{ secrets\.VERCEL_AUTOMATION_BYPASS_SECRET \}\}/,
  );
  assert.match(workflow, /ZAP_AUTH_HEADER_SITE=/);
  assert.match(workflow, /x-vercel-mitigated/);
  assert.match(workflow, /Vercel Security Checkpoint/);
});

test("ZAP baseline is pinned, report-only initially, and publishes exact-SHA status", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.ok(
    workflow.includes(
      "zaproxy/action-baseline@de8ad967d3548d44ef623df22cf95c3b0baf8b25",
    ),
  );
  assert.match(workflow, /docker_name: ghcr\.io\/zaproxy\/zaproxy:2\.17\.0/);
  assert.match(workflow, /allow_issue_writing: false/);
  assert.match(workflow, /fail_action: false/);
  assert.match(workflow, /artifact_name: zap-preview-/);
  assert.match(workflow, /context 'OWASP ZAP Preview'/);
  assert.match(workflow, /statuses: write/);
});
