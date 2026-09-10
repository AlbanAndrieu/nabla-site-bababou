import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/zap-preview.yml",
  import.meta.url,
);
const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("automatic ZAP preview starts only after a successful Vercel deployment", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /vercel\.deployment\.success/);
  assert.doesNotMatch(workflow, /vercel\.deployment\.(failure|error|canceled)/);
});

test("ZAP scanner cannot run before exact Preview and protected-access preflight", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  const checkpointIndex = workflow.indexOf(
    "- name: Verify Preview checkpoint exact SHA",
  );
  const preflightIndex = workflow.indexOf(
    "- name: Verify protected Vercel Preview access",
  );
  const zapIndex = workflow.indexOf(
    "- name: Run OWASP ZAP baseline against Vercel Preview",
  );

  assert.ok(checkpointIndex >= 0);
  assert.ok(preflightIndex > checkpointIndex);
  assert.ok(zapIndex > preflightIndex);
});

test("parent Preview gate treats Vercel as a required status before ZAP can pass", async () => {
  const ciWorkflow = await readFile(ciWorkflowUrl, "utf8");
  const waitSection = ciWorkflow
    .split("- name: Wait for Vercel, Playwright and ZAP Preview statuses")[1]
    ?.split("\n      - name:")[0];

  assert.ok(waitSection, "Preview status wait step should exist");
  assert.match(waitSection, /new Set\(\['Vercel', 'Playwright Preview E2E'\]\)/);
  assert.match(waitSection, /'OWASP ZAP Preview'/);
  assert.match(waitSection, /\['failure', 'error'\]\.includes\(status\.state\)/);
  assert.match(waitSection, /'Vercel Preview: success'/);
});

test("manual ZAP remains explicit and no pull_request trigger bypasses Preview success", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /pull_request:\s*(?:\n|$)/);
});
