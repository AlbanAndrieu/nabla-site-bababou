import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/post-merge-quality-follow-up.yml",
  import.meta.url,
);

test("post-merge follow-up watches only red Quality pushes on master", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /CI \(Quality and Security\)/);
  assert.match(workflow, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(workflow, /github\.event\.workflow_run\.head_branch == 'master'/);
  for (const conclusion of [
    "failure",
    "timed_out",
    "action_required",
    "startup_failure",
  ]) {
    assert.match(workflow, new RegExp(conclusion));
  }
});

test("stale red runs cannot mutate a newer master", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /repos\.getBranch/);
  assert.match(workflow, /master\.commit\.sha !== failedSha/);
  assert.match(workflow, /core\.setOutput\('active', 'false'\)/);
  assert.doesNotMatch(workflow, /HEAD:refs\/heads\/master/);
});

test("remediation opens an issue before attempting a bounded deterministic fix", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  const issueIndex = workflow.indexOf("- name: Open or reuse remediation issue");
  const fixIndex = workflow.indexOf("- name: Attempt bounded deterministic remediation");

  assert.ok(issueIndex >= 0);
  assert.ok(fixIndex > issueIndex);
  assert.match(workflow, /issues\.create/);
  assert.match(workflow, /git rev-parse \"\$\{FAILED_SHA\}\^\"/);
  assert.match(workflow, /scripts\/agent-quality-gate\.sh --fix/);
  assert.match(workflow, /unexpected-path/);
  assert.match(workflow, /unexpected-deletion/);
});

test("an automatic PR requires a converged diff and both strict agent gates", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  const fixIndex = workflow.indexOf("scripts/agent-quality-gate.sh --fix");
  const strictIndex = workflow.indexOf("bash scripts/agent-quality-gate.sh\n");
  const publishIndex = workflow.indexOf(
    "bash scripts/agent-quality-gate.sh --publish",
  );
  const pushIndex = workflow.indexOf("git push origin");
  const prIndex = workflow.indexOf("github.rest.pulls.create");

  assert.ok(fixIndex >= 0);
  assert.ok(strictIndex > fixIndex);
  assert.ok(publishIndex > strictIndex);
  assert.ok(pushIndex > publishIndex);
  assert.ok(prIndex > pushIndex);
  assert.match(workflow, /steps\.validate\.outputs\.validated == 'true'/);
});

test("remediation PR explicitly dispatches authoritative CI", async () => {
  const workflow = await readFile(workflowUrl, "utf8");

  assert.match(workflow, /actions\.createWorkflowDispatch/);
  assert.match(workflow, /workflow_id: 'ci\.yml'/);
  assert.match(workflow, /ref: branch/);
  assert.match(workflow, /Do not merge solely because this PR was generated automatically/);
});
