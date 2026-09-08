import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/vercel-preview.yml",
  import.meta.url,
);

test("Vercel Preview uses explicit checkpoint branches instead of PR auto-deploys", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pr_number:/);
  assert.match(workflow, /vercel-preview-pr-/);
  assert.match(workflow, /github\.rest\.pulls\.listFiles/);
  assert.match(workflow, /github\.rest\.actions\.listWorkflowRunsForRepo/);
  assert.match(workflow, /CI \(Quality and Security\)/);
  assert.match(workflow, /quality\.conclusion !== 'success'/);
  assert.match(workflow, /actions: read/);
  assert.ok(workflow.includes("actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803"));
  assert.match(workflow, /ref: \$\{\{ steps\.preview\.outputs\.sha \}\}/);
  assert.match(workflow, /git push --force origin "HEAD:refs\/heads\/\$\{CHECKPOINT_BRANCH\}"/);
  assert.doesNotMatch(workflow, /github\.rest\.git\.(createRef|updateRef)/);
});

test("Vercel Preview checkpoint keeps Bababou hybrid runtime files deploy-relevant", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /filename\.startsWith\('unit-tests\/'\)/);
  assert.match(workflow, /filename\.startsWith\('\.github\/'\)/);
  assert.doesNotMatch(workflow, /filename\.startsWith\('public\/'\)/);
  assert.doesNotMatch(workflow, /filename\.startsWith\('app\/'\)/);
});

test("closed pull requests clean up their dedicated Preview branch", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /types:\s*\n\s*- closed/);
  assert.match(workflow, /github\.rest\.git\.deleteRef/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /contents: write/);
});
