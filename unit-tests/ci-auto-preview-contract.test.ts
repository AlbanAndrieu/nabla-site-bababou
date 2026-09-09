import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("Quality automatically publishes exact PR Preview checkpoints after success", async () => {
  const workflow = await readFile(ciUrl, "utf8");

  assert.match(workflow, /preview-security:/);
  assert.match(workflow, /needs: quality/);
  assert.match(workflow, /needs\.quality\.result == 'success'/);
  assert.match(workflow, /github\.event\.pull_request\.draft == false/);
  assert.match(
    workflow,
    /github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,
  );
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /statuses: read/);
  assert.match(workflow, /ref: \$\{\{ steps\.preview\.outputs\.sha \}\}/);
  assert.match(
    workflow,
    /git push --force origin "HEAD:refs\/heads\/\$\{CHECKPOINT_BRANCH\}"/,
  );
  assert.match(workflow, /vercel-preview-pr-/);
});

test("automatic Preview policy preserves maintenance skips but forces security workflows", async () => {
  const workflow = await readFile(ciUrl, "utf8");

  for (const path of [
    ".github/workflows/ci.yml",
    ".github/workflows/playwright.yml",
    ".github/workflows/vercel-preview.yml",
    ".github/workflows/zap-preview.yml",
  ]) {
    assert.ok(workflow.includes(`'${path}'`), path);
  }

  assert.match(workflow, /filename\.startsWith\('docs\/'\)/);
  assert.match(workflow, /filename\.startsWith\('unit-tests\/'\)/);
  assert.match(workflow, /No deploy-relevant files/);
});

test("Preview security gate waits for both Playwright and OWASP ZAP exact-SHA statuses", async () => {
  const workflow = await readFile(ciUrl, "utf8");

  assert.match(workflow, /Playwright Preview E2E/);
  assert.match(workflow, /OWASP ZAP Preview/);
  assert.match(workflow, /zap_bootstrap/);
  assert.match(workflow, /ZAP_BOOTSTRAP/);
  assert.match(workflow, /repository_dispatch uses the default-branch workflow/);
  assert.match(workflow, /listCommitStatusesForRef/);
  assert.match(workflow, /STATUS_SHA/);
  assert.match(workflow, /PR_NUMBER/);
  assert.match(workflow, /livePr\.head\.sha !== sha/);
  assert.match(workflow, /stop waiting on stale Preview statuses/);
  assert.match(workflow, /state === 'success'/);
  assert.match(workflow, /failure', 'error/);
  assert.match(workflow, /Timed out waiting for/);
});
