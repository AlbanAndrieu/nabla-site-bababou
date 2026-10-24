import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync as makeDir, mkdirSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const scope = fileURLToPath(new URL("../scripts/ci-scope.sh", import.meta.url));
const offline = fileURLToPath(new URL("../scripts/agent-offline-check.sh", import.meta.url));

function fixture(t) {
  const cwd = makeDir(join(tmpdir(), "bababou-git-failure-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "scope@example.invalid");
  git("config", "user.name", "Scope Failure Fixture");
  writeFileSync(join(cwd, "README.md"), "baseline\n");
  git("add", "--", "README.md");
  git("commit", "-qm", "initial");
  const base = git("rev-parse", "HEAD");
  writeFileSync(join(cwd, "valid.sh"), "true\n");
  const bin = join(cwd, "test-bin");
  mkdirSync(bin);
  const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const realSort = execFileSync("which", ["sort"], { encoding: "utf8" }).trim();
  const mock = (command, failure) => {
    const target = join(bin, command);
    const binary = command === "git" ? realGit : realSort;
    writeFileSync(target, "#!/bin/sh\nif " + failure + "; then exit 45; fi\nexec \"" + binary + "\" \"$@\"\n");
    chmodSync(target, 0o755);
  };
  const run = (script, env = {}) => spawnSync("bash", script === scope ? [scope, base, "WORKTREE"] : [offline], {
    cwd, encoding: "utf8",
    env: {
      ...process.env,
      QUALITY_BASE_REF: base,
      AGENT_OFFLINE_REQUIRE_BASE: "1",
      GITHUB_OUTPUT: "",
      ...env,
    },
  });
  return { cwd, base, bin, run, mock };
}

test("CI WORKTREE scope succeeds when the local Git inventory is sound", (t) => {
  const f = fixture(t);
  const r = f.run(scope);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^preview_required=true$/m);
  assert.match(r.stdout, /^changed_count=1$/m);
});

test("offline strict mode succeeds with a valid local diff", (t) => {
  const f = fixture(t);
  const r = f.run(offline);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /OFFLINE_L1_PASS/);
});

test("CI scope rejects a failed diff even when the final ls-files succeeds", (t) => {
  const f = fixture(t);
  f.mock("git", '[ "$1" = diff ]');
  const r = f.run(scope, { PATH: f.bin + ":" + process.env.PATH });
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stderr, /CI_SCOPE_GIT_FAILED/);
  assert.doesNotMatch(r.stdout, /preview_required=false/);
});

test("offline L1 rejects a failed intermediate diff", (t) => {
  const f = fixture(t);
  f.mock("git", '[ "$1" = diff ]');
  const r = f.run(offline, { PATH: f.bin + ":" + process.env.PATH });
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stderr, /OFFLINE_GIT_SCOPE_FAILED/);
  assert.doesNotMatch(r.stdout, /OFFLINE_L1_PASS/);
});

test("CI scope refuses a failed Git path sorter", (t) => {
  const f = fixture(t);
  f.mock("sort", "true");
  const r = f.run(scope, { PATH: f.bin + ":" + process.env.PATH });
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stderr, /CI_SCOPE_GIT_FAILED/);
});

test("offline inventory refuses a failed Git path sorter", (t) => {
  const f = fixture(t);
  f.mock("sort", "true");
  const r = f.run(offline, { PATH: f.bin + ":" + process.env.PATH });
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stderr, /OFFLINE_GIT_SCOPE_FAILED/);
});

test("offline fallback refuses failed ls-files rather than claiming a scan", (t) => {
  const f = fixture(t);
  f.mock("git", '[ "$1" = ls-files ]');
  const r = f.run(offline, {
    PATH: f.bin + ":" + process.env.PATH,
    QUALITY_BASE_REF: "refs/heads/missing",
    AGENT_OFFLINE_REQUIRE_BASE: "0",
  });
  assert.equal(r.status, 2, r.stderr + r.stdout);
  assert.match(r.stderr, /OFFLINE_GIT_SCOPE_FAILED/);
  assert.doesNotMatch(r.stdout, /OFFLINE_L1_PASS/);
});
