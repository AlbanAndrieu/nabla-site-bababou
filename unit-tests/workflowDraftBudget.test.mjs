import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const checker = fileURLToPath(new URL("../scripts/ci/check-draft-workflows.mjs", import.meta.url));
const workflows = ["ci", "docker-build", "node24-compat", "copilot-setup-steps"];

function fixture(t, { unguarded, missingReview } = {}) {
  const root = mkdtempSync(join(tmpdir(), "bababou-draft-budget-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dir = join(root, ".github", "workflows");
  mkdirSync(dir, { recursive: true });
  for (const name of workflows) {
    const guard = name === unguarded ? "" : "    if: github.event_name != 'pull_request' || github.event.pull_request.draft == false\n";
    const review = name === missingReview ? "opened, synchronize" : "opened, synchronize, ready_for_review";
    writeFileSync(join(dir, `${name}.yml`), [
      `name: ${name}`,
      "on:",
      "  pull_request:",
      `    types: [${review}]`,
      "jobs:",
      "  quality:",
      guard.trimEnd(),
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: echo valid",
      "",
    ].filter(Boolean).join("\n"));
  }
  return () => spawnSync(process.execPath, [checker, root], { encoding: "utf8" });
}

test("all four PR workflows block runners on drafts", (t) => {
  const result = fixture(t)();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /DRAFT_GUARD_OK workflows=4 jobs=4/);
});

test("a missing job-level draft guard fails closed", (t) => {
  const result = fixture(t, { unguarded: "ci" })();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DRAFT_GUARD_FAIL .*ci.yml.*not guarded/);
});

test("ready_for_review remains required before activating paid checks", (t) => {
  const result = fixture(t, { missingReview: "docker-build" })();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing pull_request\/ready_for_review/);
});

test("a missing workflow file is never treated as green", (t) => {
  const root = mkdtempSync(join(tmpdir(), "bababou-draft-missing-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [checker, root], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DRAFT_GUARD_FAIL/);
});
