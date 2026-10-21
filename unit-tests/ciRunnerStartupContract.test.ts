import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const verifier = fileURLToPath(
  new URL("../scripts/ci/diagnose-actions-startup.sh", import.meta.url),
);
const sha = "a".repeat(40);

test("read-only Actions triage distinguishes runner failure from real test failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "bababou-actions-triage-"));
  try {
    const bin = join(root, "bin");
    await mkdir(bin);
    const gh = join(bin, "gh");
    await writeFile(
      gh,
      '#!/usr/bin/env bash\ncase "${@: -1}" in\n  *"/jobs?per_page=100") cat "$FAKE_JOBS" ;;\n  *) cat "$FAKE_RUN" ;;\nesac\n',
    );
    await chmod(gh, 0o755);
    const runPath = join(root, "run.json");
    const jobsPath = join(root, "jobs.json");
    const run = (expectedSha = sha) =>
      spawnSync(
        "bash",
        [verifier, "AlbanAndrieu/nabla-site-bababou", "123", expectedSha],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: bin + ":" + (process.env.PATH ?? ""),
            FAKE_RUN: runPath,
            FAKE_JOBS: jobsPath,
          },
        },
      );

    await writeFile(
      runPath,
      JSON.stringify({ id: 123, status: "completed", conclusion: "failure", head_sha: sha }),
    );
    await writeFile(
      jobsPath,
      JSON.stringify({
        total_count: 1,
        jobs: [{ id: 456, name: "quality", conclusion: "failure", runner_id: null, steps: null }],
      }),
    );
    const preRun = run();
    assert.equal(preRun.status, 2, preRun.stderr);
    assert.match(preRun.stdout, /ACTIONS_PRE_RUN_FAILURE/);
    assert.doesNotMatch(preRun.stdout, /ACTIONS_STEP_FAILURE/);

    await writeFile(
      jobsPath,
      JSON.stringify({
        total_count: 1,
        jobs: [{ id: 456, name: "quality", conclusion: "failure", runner_id: 789, steps: [{ name: "Run tests" }] }],
      }),
    );
    const executed = run();
    assert.equal(executed.status, 1, executed.stderr);
    assert.match(executed.stdout, /ACTIONS_STEP_FAILURE/);

    await writeFile(
      runPath,
      JSON.stringify({ id: 123, status: "completed", conclusion: "success", head_sha: sha }),
    );
    await writeFile(
      jobsPath,
      JSON.stringify({
        total_count: 1,
        jobs: [{ id: 456, name: "quality", conclusion: "success", runner_id: 789, steps: [{ name: "Test" }] }],
      }),
    );
    assert.equal(run().status, 0);
    const mismatch = run("b".repeat(40));
    assert.equal(mismatch.status, 4);
    assert.match(mismatch.stderr, /ACTIONS_DIAG_SHA_MISMATCH/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Actions triage never writes to the GitHub API", async () => {
  const source = await readFile(verifier, "utf8");
  assert.match(source, /gh api --method GET/);
  assert.doesNotMatch(source, /gh (run rerun|api --method (POST|PATCH|DELETE))/);
});
