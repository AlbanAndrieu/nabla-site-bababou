import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
  "../.github/workflows/post-merge-quality-follow-up.yml",
  import.meta.url,
);
const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("quality failures share a serialized issue ledger without losing SHA", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  assert.match(workflow, /group: post-merge-quality-master-ledger/);
  assert.match(workflow, /unresolved master Quality failures/);
  assert.match(workflow, /FAILED_SHA: \$\{\{ env\.FAILED_SHA \}\}/);
  assert.match(workflow, /FAILED_RUN_URL: \$\{\{ env\.FAILED_RUN_URL \}\}/);
  assert.match(workflow, /issues\.createComment/);
  assert.doesNotMatch(workflow, /const title = `\[quality-follow-up\]/);
});

test("BetterLeaks caches compilation only and always executes its scan", async () => {
  const workflow = await readFile(ciUrl, "utf8");
  assert.match(workflow, /Restore BetterLeaks Go caches/);
  assert.match(workflow, /Save BetterLeaks Go caches/);
  assert.match(workflow, /go\/pkg\/mod/);
  assert.match(workflow, /\.cache\/go-build/);
  assert.match(workflow, /go install github\.com\/betterleaks\/betterleaks@v1\.9\.0/);
  assert.match(workflow, /betterleaks" git \. /);
  assert.doesNotMatch(workflow, /cache.*betterleaks-bin/);
});
