import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const gate = readFileSync(join(root, "scripts/agent-quality-gate.sh"), "utf8");
const start = gate.indexOf("validate_untracked_whitespace() {");
const end = gate.indexOf("\nrun_dependency_free_preflight() {", start);
assert.ok(start >= 0 && end > start, "cannot locate unchanged preflight function");
const functionSource = gate.slice(start, end);

function fixture(t, file, content) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-untracked-whitespace-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.name", "Preflight Test");
  git("config", "user.email", "preflight@example.invalid");
  const path = join(cwd, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  const run = (env = {}) => spawnSync(
    "bash", ["-c", "set -euo pipefail\n" + functionSource + "\nvalidate_untracked_whitespace"],
    { cwd, encoding: "utf8", env: { ...process.env, ...env } },
  );
  return { cwd, run };
}

test("untracked Markdown with embedded newline cannot bypass whitespace rejection", (t) => {
  const { run } = fixture(t, "docs/incident\nnotes.md", "bad  \n");
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trailing whitespace/);
});

test("untracked Markdown with tab in the pathname is checked", (t) => {
  const { run } = fixture(t, "docs/notice\tversion.md", "bad  \n");
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trailing whitespace/);
});

test("clean newline and leading-dash paths pass preflight", (t) => {
  for (const path of ["docs/good\nnotice.md", "-leading-dash.md", "docs/file with spaces.md"]) {
    const { run } = fixture(t, path, "clean content\n");
    const result = run();
    assert.equal(result.status, 0, path + ": " + result.stderr);
  }
});

test("untracked Git inventory failure fails closed", (t) => {
  const { cwd, run } = fixture(t, "docs/notice.md", "clean\n");
  const bin = join(cwd, "bin");
  mkdirSync(bin);
  const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const mock = join(bin, "git");
  writeFileSync(mock, "#!/bin/sh\nif [ \"$1\" = ls-files ]; then exit 42; fi\nexec \"" + realGit + "\" \"$@\"\n");
  chmodSync(mock, 0o755);
  const result = run({ PATH: bin + ":" + process.env.PATH });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /QG_UNTRACKED_GIT_FAILED/);
});

test("the quality preflight has no unsafe newline-delimited inventory", () => {
  assert.match(functionSource, /git ls-files --others --exclude-standard -z/);
  assert.match(functionSource, /while IFS= read -r -d '' file/);
  assert.doesNotMatch(functionSource, /done < <\(git ls-files/);
});
