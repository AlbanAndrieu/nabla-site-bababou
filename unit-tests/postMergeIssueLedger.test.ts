import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/post-merge-quality-follow-up.yml",
  import.meta.url,
);
const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("quality ledger preserves each failed master SHA", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /group: post-merge-quality-master-ledger/);
  assert.match(workflow, /unresolved master Quality failures/);
  assert.match(workflow, /FAILED_SHA: \$\{\{ env\.FAILED_SHA \}\}/);
  assert.match(workflow, /FAILED_RUN_URL: \$\{\{ env\.FAILED_RUN_URL \}\}/);
  assert.match(workflow, /issues\.createComment/);
  assert.doesNotMatch(workflow, /const title = `\[quality-follow-up\]/);
});

test("BetterLeaks caches compilation but never skips scanning", async () => {
  const workflow = await readFile(ciUrl, "utf8");
  assert.match(workflow, /Restore BetterLeaks Go caches/);
  assert.match(workflow, /Save BetterLeaks Go caches/);
  assert.match(workflow, /go\/pkg\/mod/);
  assert.match(workflow, /\.cache\/go-build/);
  assert.match(
    workflow,
    /go install github\.com\/betterleaks\/betterleaks@v1\.9\.0/,
  );
  assert.match(workflow, /betterleaks" git \. /);
  assert.doesNotMatch(workflow, /cache.*betterleaks-bin/);
});

test("no human-edited issue is reopened, rewritten or closed", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.doesNotMatch(workflow, /state: 'open'\s*,?\s*\}\)/);
  assert.match(workflow, /listEvents/);
  assert.match(workflow, /listComments/);
  assert.match(workflow, /actor\?\.login !== 'github-actions\[bot\]'/);
  assert.match(workflow, /comments\.some/);
  assert.match(workflow, /bababou-automated-master-quality-v1/);
});

test("ledger closes only after two latest green master push CI runs", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /close-after-two-green:/);
  assert.match(workflow, /workflow_id: 'ci\.yml'/);
  assert.match(workflow, /branch: 'master', event: 'push'/);
  assert.match(workflow, /workflow_runs\.slice\(0, 2\)/);
  assert.match(workflow, /last\.length !== 2/);
  assert.match(workflow, /run\.status !== 'completed' \|\| run\.conclusion !== 'success'/);
  assert.match(workflow, /state: 'closed'/);
  assert.doesNotMatch(workflow, /labels: \[/);
});
