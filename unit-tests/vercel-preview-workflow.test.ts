import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/vercel-preview.yml",
  import.meta.url,
);

test("on-demand Preview requires exact Quality evidence and uses checkpoint helper", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pr_number:/);
  assert.match(workflow, /pr\.draft/);
  assert.match(workflow, /vercel-preview-pr-/);
  assert.match(workflow, /github\.rest\.pulls\.listFiles/);
  assert.match(workflow, /github\.rest\.actions\.listWorkflowRunsForRepo/);
  assert.match(workflow, /head_sha: sha/);
  assert.match(workflow, /CI \(Quality and Security\)/);
  assert.match(workflow, /qualityRun\.conclusion !== 'success'/);
  assert.match(workflow, /right\.run_number - left\.run_number/);
  assert.match(workflow, /actions: read/);
  assert.ok(
    workflow.includes(
      "actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803",
    ),
  );
  assert.match(workflow, /ref: \$\{\{ steps\.preview\.outputs\.sha \}\}/);
  assert.match(workflow, /base_sha/);
  assert.match(workflow, /publish-vercel-preview-checkpoint\.sh/);
  assert.doesNotMatch(workflow, /git push --force origin/);
  assert.doesNotMatch(workflow, /github\.rest\.git\.(createRef|updateRef)/);
});

test("on-demand Preview keeps maintenance policy aligned without hiding runtime changes", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  for (const predicate of [
    "filename.startsWith('docs/')",
    "filename.startsWith('unit-tests/')",
    "filename.startsWith('tests/')",
    "filename.startsWith('.github/')",
    "filename.startsWith('.zap/')",
    "filename.startsWith('commitlint.config.')",
    "filename.startsWith('playwright.config.')",
  ]) {
    assert.ok(workflow.includes(predicate), predicate);
  }

  assert.doesNotMatch(workflow, /filename\.startsWith\('public\/'\)/);
  assert.doesNotMatch(workflow, /filename\.startsWith\('app\/'\)/);
  assert.doesNotMatch(workflow, /forceCheckpoint/);
});

test("workflow-only changes no longer force an on-demand Vercel Preview", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /filename\.startsWith\('\.github\/'\)/);
  assert.doesNotMatch(workflow, /forceCheckpoint\.has\(filename\)/);
  assert.match(workflow, /No deploy-relevant files: no Vercel checkpoint is published/);
});

test("closed pull requests clean up their dedicated Preview branch", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /types:\s*\n\s*- closed/);
  assert.match(workflow, /github\.rest\.git\.deleteRef/);
  assert.match(workflow, /heads\/vercel-preview-pr-/);
  assert.match(workflow, /heads\/vercel-preview-bootstrap-pr-/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /contents: write/);
});
