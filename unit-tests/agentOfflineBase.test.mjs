import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../scripts/agent-offline-check.sh", import.meta.url),
);

function scenario(t) {
  const root = mkdtempSync(join(tmpdir(), "bababou-offline-base-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git("init", "-q", "-b", "master");
  git("config", "user.email", "offline@example.invalid");
  git("config", "user.name", "Offline Contract");
  writeFileSync(join(root, "ok.sh"), "true\n");
  git("add", ".");
  git("commit", "-qm", "initial");
  const base = git("rev-parse", "HEAD");
  git("switch", "-q", "-c", "feature");
  writeFileSync(join(root, "next.sh"), "true\n");
  git("add", ".");
  git("commit", "-qm", "feature");
  const run = (overrides = {}) =>
    spawnSync("bash", [script], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        QUALITY_BASE_REF: base,
        AGENT_OFFLINE_REQUIRE_BASE: "1",
        ...overrides,
      },
    });
  return { root, git, base, run };
}

test("strict offline PR mode accepts an ancestor base", (t) => {
  const { run } = scenario(t);
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /OFFLINE_SCOPE_DIFF/);
  assert.match(result.stdout, /OFFLINE_L1_PASS/);
});

test("strict offline PR mode rejects a missing explicit base", (t) => {
  const { run } = scenario(t);
  const result = run({ QUALITY_BASE_REF: "refs/heads/does-not-exist" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /OFFLINE_BASE_REQUIRED/);
  assert.doesNotMatch(result.stdout, /OFFLINE_L1_PASS/);
});

test("strict offline PR mode rejects a divergent current base", (t) => {
  const { git, root, run } = scenario(t);
  git("switch", "-q", "master");
  writeFileSync(join(root, "master.sh"), "true\n");
  git("add", ".");
  git("commit", "-qm", "new base");
  git("switch", "-q", "feature");

  const strict = run({ QUALITY_BASE_REF: "master" });
  assert.equal(strict.status, 2);
  assert.match(strict.stderr, /OFFLINE_BASE_DIVERGED/);
  assert.doesNotMatch(strict.stdout, /OFFLINE_L1_PASS/);

  const diagnostic = run({
    QUALITY_BASE_REF: "master",
    AGENT_OFFLINE_REQUIRE_BASE: "0",
  });
  assert.equal(diagnostic.status, 0, diagnostic.stderr);
  assert.match(diagnostic.stderr, /OFFLINE_BASE_DIVERGED.*NOT VERIFIED/);
  assert.match(diagnostic.stdout, /OFFLINE_L1_PASS/);
});

test("strict offline PR mode validates its boolean setting", (t) => {
  const { run } = scenario(t);
  const result = run({ AGENT_OFFLINE_REQUIRE_BASE: "yes" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /OFFLINE_REQUIRE_BASE_INVALID/);
  assert.doesNotMatch(result.stdout, /OFFLINE_L1_PASS/);
});


test("NUL-delimited inventory parses unusual untracked and committed filenames", (t) => {
  const { root, run, git } = scenario(t);
  const newlinePath = join(root, "multi\nline.sh");
  const leadingDashPath = join(root, "-leading-dash.sh");

  writeFileSync(newlinePath, "if then\n");
  const first = run();
  assert.notEqual(first.status, 0);
  assert.match(first.stderr, /syntax error/);
  assert.doesNotMatch(first.stdout, /OFFLINE_L1_PASS/);

  writeFileSync(newlinePath, "true\n");
  writeFileSync(leadingDashPath, "if then\n");
  const second = run();
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /syntax error/);

  writeFileSync(leadingDashPath, "true\n");
  git("add", ".");
  git("commit", "-qm", "commit filenames with LF and leading dash");
  const accepted = run();
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /paths=3 syntax_checked=3/);
});
