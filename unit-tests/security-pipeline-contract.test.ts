import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const productionDastUrl = new URL(
  "../.github/workflows/production-dast.yml",
  import.meta.url,
);

test("Quality runs changed-source Semgrep before the expensive Node build", async () => {
  const workflow = await readFile(ciUrl, "utf8");

  const semgrep = workflow.indexOf("Run Semgrep SAST on changed source");
  const setupNode = workflow.indexOf("Setup Node.js");
  assert.ok(semgrep > 0);
  assert.ok(setupNode > semgrep);
  assert.match(workflow, /semgrep\/semgrep@sha256:/);
  assert.match(workflow, /--sarif/);
  assert.match(workflow, /semgrep-sast-report/);
  assert.match(workflow, /id: semgrep-sarif/);
  assert.match(workflow, /ENABLE_CODE_SCANNING_SARIF/);
  assert.match(workflow, /Report Code Scanning SARIF opt-in disabled/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /security-events: write/);
});

test("Quality retains Semgrep SARIF artifacts only for failed scans", async () => {
  const workflow = await readFile(ciUrl, "utf8");
  const preserveStart = workflow.indexOf("- name: Preserve failed Semgrep SAST report");
  const cleanStart = workflow.indexOf("- name: Clean Semgrep SAST workspace", preserveStart);
  const preserveBlock = workflow.slice(preserveStart, cleanStart);

  assert.ok(preserveStart >= 0);
  assert.ok(cleanStart > preserveStart);
  assert.match(preserveBlock, /steps\.semgrep-sast\.outcome != 'success'/);
  assert.match(preserveBlock, /retention-days: 7/);
  assert.match(workflow, /SARIF artifact: not retained for successful scans/);
  assert.match(
    workflow,
    /Diagnostic report: \*\*semgrep-sast-report\*\* workflow artifact \(7 days\)/,
  );
  assert.doesNotMatch(workflow, /- name: Preserve Semgrep SAST report\n/);
});

test("Production DAST runs after production deployments and daily with the shared ZAP policy", async () => {
  const workflow = await readFile(productionDastUrl, "utf8");

  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /www\.bababou\.com/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /x-vercel-protection-bypass/);
  assert.match(workflow, /x-vercel-trusted-oidc-idp-token/);
  assert.match(workflow, /rules_file_name: "\.zap\/rules\.tsv"/);
  assert.match(workflow, /fail_action: true/);
  assert.match(workflow, /artifact_name: zap-production-report/);
  assert.match(workflow, /context 'Production DAST'/);
  assert.match(workflow, /H\$high M\$medium L\$low I\$informational/);
});
