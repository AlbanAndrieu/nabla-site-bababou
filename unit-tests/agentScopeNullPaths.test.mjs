import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, "scripts/lib/agent-quality-support.sh"), "utf8");
const start = source.indexOf("collect_changed_files() {");
const end = source.indexOf("\n# Print \"<digest>\\t<path>\"", start);
assert.ok(start >= 0 && end > start, "cannot isolate Git inventory functions");
const functions = source.slice(start, end);

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-agent-scope-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "inventory@example.invalid");
  git("config", "user.name", "Git Inventory");
  const write = (path, data = "content\n") => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), data);
  };
  write("old\npublic.md");
  git("add", "--", "old\npublic.md");
  git("commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD");
  const run = (command, env = {}) => spawnSync("bash", [
    "-c", "set -euo pipefail\n" + functions + "\n" + command,
  ], { cwd, env: { ...process.env, BASE_REF: base, ...env }, encoding: null });
  return { cwd, git, write, base, run };
}

const paths = (output) => output.toString("utf8").split("\0").filter(Boolean);

test("NUL inventory keeps newline and tab Git filenames intact", (t) => {
  const f = fixture(t);
  f.write("docs/notes\nrevision.md");
  f.write("public/letter\twith spaces.md");
  const result = f.run("collect_changed_files");
  assert.equal(result.status, 0, result.stderr.toString());
  assert.deepEqual(paths(result.stdout).sort(), [
    "docs/notes\nrevision.md",
    "public/letter\twith spaces.md",
  ].sort());
});

test("committed deletion is inventoried once and not mistaken for an addition", (t) => {
  const f = fixture(t);
  f.git("rm", "--", "old\npublic.md");
  f.git("commit", "-qm", "remove old public content");
  const deleted = f.run("collect_deleted_files");
  assert.equal(deleted.status, 0, deleted.stderr.toString());
  assert.deepEqual(paths(deleted.stdout), ["old\npublic.md"]);
  const changed = f.run("collect_changed_files");
  assert.equal(changed.status, 0, changed.stderr.toString());
  assert.deepEqual(paths(changed.stdout), []);
});

test("tracked rename away from public produces source deletion and destination addition", (t) => {
  const f = fixture(t);
  f.write("public/notice.md");
  f.git("add", "--", "public/notice.md");
  f.git("commit", "-qm", "serve notice");
  mkdirSync(join(f.cwd, "docs"), { recursive: true });
  f.git("mv", "--", "public/notice.md", "docs/notice.md");
  const added = f.run("collect_changed_files");
  assert.equal(added.status, 0, added.stderr.toString());
  assert.ok(paths(added.stdout).includes("docs/notice.md"));
  const removed = f.run("collect_deleted_files");
  assert.equal(removed.status, 0, removed.stderr.toString());
  assert.ok(paths(removed.stdout).includes("public/notice.md"));
});

test("a Git inventory failure is not returned as an empty success", (t) => {
  const f = fixture(t);
  const bin = join(f.cwd, "bin");
  mkdirSync(bin);
  const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const mock = join(bin, "git");
  writeFileSync(mock, "#!/bin/sh\nif [ \"$1\" = diff ]; then exit 43; fi\nexec \"" + realGit + "\" \"$@\"\n");
  chmodSync(mock, 0o755);
  const result = f.run("collect_changed_files", { PATH: bin + ":" + process.env.PATH });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr.toString(), /QG_GIT_SCOPE_FAILED/);
});

test("deleted-file inventory refuses Git failures", (t) => {
  const f = fixture(t);
  const bin = join(f.cwd, "bin");
  mkdirSync(bin);
  const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const mock = join(bin, "git");
  writeFileSync(mock, "#!/bin/sh\nif [ \"$1\" = diff ]; then exit 43; fi\nexec \"" + realGit + "\" \"$@\"\n");
  chmodSync(mock, 0o755);
  const result = f.run("collect_deleted_files", { PATH: bin + ":" + process.env.PATH });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr.toString(), /QG_GIT_DELETED_SCOPE_FAILED/);
});

test("workspace fingerprint refuses an incomplete diff", (t) => {
  const f = fixture(t);
  const bin = join(f.cwd, "bin");
  mkdirSync(bin);
  const realGit = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  const mock = join(bin, "git");
  writeFileSync(mock, "#!/bin/sh\nif [ \"$1\" = diff ]; then exit 43; fi\nexec \"" + realGit + "\" \"$@\"\n");
  chmodSync(mock, 0o755);
  const result = f.run("workspace_fingerprint", { PATH: bin + ":" + process.env.PATH });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr.toString(), /QG_(?:GIT_SCOPE|WORKSPACE_FINGERPRINT)_FAILED/);
  assert.doesNotMatch(result.stdout.toString(), /^[a-f0-9]{64}$/);
});

test("workspace fingerprints detect newline-path content updates", (t) => {
  const f = fixture(t);
  const path = "docs/changed\nname.md";
  f.write(path, "first\n");
  const first = f.run("workspace_fingerprint");
  assert.equal(first.status, 0, first.stderr.toString());
  f.write(path, "second\n");
  const second = f.run("workspace_fingerprint");
  assert.equal(second.status, 0, second.stderr.toString());
  assert.match(first.stdout.toString(), /^[a-f0-9]{64}\n$/);
  assert.notEqual(first.stdout.toString(), second.stdout.toString());
});

test("agent gate consumes both inventories as checked NUL-delimited files", () => {
  const gate = readFileSync(join(root, "scripts/agent-quality-gate.sh"), "utf8");
  assert.match(gate, /mapfile -d '' -t CHANGED_FILES/);
  assert.match(gate, /mapfile -d '' -t DELETED_FILES/);
  assert.match(gate, /mapfile -d '' -t fix_files/);
  assert.match(gate, /QG_SCOPE_ENUMERATION_FAILED/);
  assert.doesNotMatch(gate, /mapfile -t CHANGED_FILES < <\(collect_changed_files\)/);
});
