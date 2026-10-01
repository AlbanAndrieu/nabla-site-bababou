import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);

test("critical quality and Preview shell entrypoints remain executable", async () => {
  const executableScripts = [
    "scripts/quality-gate.sh",
    "scripts/agent-quality-gate.sh",
    "scripts/agent-p0-check.sh",
    "scripts/agent-publish.sh",
    "scripts/ci-scope.sh",
    "scripts/verify-production-baseline.sh",
    "scripts/verify-production-live.sh",
    "scripts/ci-performance-budget.sh",
    "scripts/publish-vercel-preview-checkpoint.sh",
  ] as const;

  for (const relativePath of executableScripts) {
    const info = await stat(new URL(relativePath, repositoryRoot));
    assert.notEqual(
      info.mode & 0o100,
      0,
      `${relativePath} must keep the owner executable bit`,
    );
  }
});

test("sourced quality libraries remain non-executable", async () => {
  for (const relativePath of [
    "scripts/lib/agent-quality-support.sh",
    "scripts/lib/production-baseline-classification.sh",
  ] as const) {
    const info = await stat(new URL(relativePath, repositoryRoot));
    assert.equal(
      info.mode & 0o111,
      0,
      `${relativePath} is sourced and must remain non-executable`,
    );
  }
});
