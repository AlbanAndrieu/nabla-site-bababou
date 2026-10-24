import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/ci-scope.sh", import.meta.url));

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-ci-nul-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "ci-nul@example.invalid");
  git("config", "user.name", "CI NUL Fixture");
  writeFileSync(join(cwd, "baseline.txt"), "baseline\n");
  git("add", "--", "baseline.txt");
  git("commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD");
  const write = (path) => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), "content\n");
  };
  const run = (mode = "HEAD", options = {}) =>
    spawnSync("bash", [script, options.base ?? base, mode], {
      cwd, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: "", ...options.env },
    });
  return { cwd, git, base, run, write };
}

function assertScope(result, { maintenance, count, build }) {
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^maintenance_only=${maintenance}$`, "m"));
  assert.match(result.stdout, new RegExp(`^changed_count=${count}$`, "m"));
  assert.match(result.stdout, new RegExp(`^build=${build}$`, "m"));
  assert.match(result.stdout, new RegExp(`^preview_required=${build}$`, "m"));
}

test("committed public path with newline remains one deploy-relevant entry", (t) => {
  const f = fixture(t);
  const path = "public/notice\nletter.md";
  f.write(path);
  f.git("add", "--", path);
  f.git("commit", "-qm", "public document");
  assertScope(f.run(), { maintenance: false, build: true, count: 1 });
});

test("committed nested documentation with newline stays a single safe path", (t) => {
  const f = fixture(t);
  const path = "docs/recovery\nnotes.md";
  f.write(path);
  f.git("add", "--", path);
  f.git("commit", "-qm", "documentation");
  assertScope(f.run(), { maintenance: true, build: false, count: 1 });
});

test("committed tab and space filename still requires production validation", (t) => {
  const f = fixture(t);
  const path = "public/privacy\tletter with spaces.md";
  f.write(path);
  f.git("add", "--", path);
  f.git("commit", "-qm", "public assets");
  assertScope(f.run(), { maintenance: false, build: true, count: 1 });
});

test("WORKTREE scope preserves staged and untracked paths independently", (t) => {
  const f = fixture(t);
  const staged = "docs/operator\nnotes.md";
  const untracked = "public/letter\twith spaces.md";
  f.write(staged);
  f.git("add", "--", staged);
  f.write(untracked);
  assertScope(f.run("WORKTREE"), { maintenance: false, build: true, count: 2 });
});

test("WORKTREE root Markdown alone remains maintenance-only", (t) => {
  const f = fixture(t);
  f.write("README.md");
  assertScope(f.run("WORKTREE"), { maintenance: true, build: false, count: 1 });
});

test("rename away from public counts both source and destination", (t) => {
  const f = fixture(t);
  f.write("public/notice.md");
  f.git("add", "--", "public/notice.md");
  f.git("commit", "-qm", "serve notice");
  const previous = f.git("rev-parse", "HEAD");
  f.write("docs/.keep");
  f.git("mv", "--", "public/notice.md", "docs/notice.md");
  f.git("commit", "-qm", "move to docs");
  assertScope(f.run("HEAD", { base: previous }), { maintenance: false, build: true, count: 2 });
});

test("invalid comparison base fails closed before emitting a scope", (t) => {
  const f = fixture(t);
  const result = f.run("HEAD", { base: "refs/heads/not-found" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CI_SCOPE_BASE_MISSING/);
  assert.doesNotMatch(result.stdout, /maintenance_only=true/);
});
