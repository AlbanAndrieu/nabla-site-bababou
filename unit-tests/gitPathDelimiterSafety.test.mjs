import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ciScript = join(root, "scripts/ci-scope.sh");
const classifier = join(root, "scripts/lib/production-baseline-classification.sh");

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-baseline-nul-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  const add = (path, content = "content\n") => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), content);
    git("add", "--", path);
  };
  git("init", "-q");
  git("config", "user.email", "baseline@example.invalid");
  git("config", "user.name", "Baseline Test");
  add("README.md");
  git("commit", "-qm", "initial");
  const base = git("rev-parse", "HEAD");
  const commit = (message = "fixture") => {
    git("commit", "-qm", message);
    return git("rev-parse", "HEAD");
  };
  const run = (functionName, child, overrides = {}) =>
    spawnSync("bash", ["-c", 'source "$1"; "$2" "$3" "$4"', "classifier-test", classifier, functionName, base, child], {
      cwd, encoding: "utf8", env: { ...process.env, ...overrides },
    });
  const ci = (child) => spawnSync("bash", [ciScript, base, child], { cwd, encoding: "utf8" });
  return { cwd, git, add, commit, run, ci, base };
}

test("newline-bearing public name cannot inherit production baseline", (t) => {
  const f = fixture(t);
  f.add("public/legal\nnotice.md");
  const child = f.commit();
  const result = f.run("maintenance_only_hop", child);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
  const scope = f.ci(child);
  assert.equal(scope.status, 0, scope.stderr);
  assert.match(scope.stdout, /^changed_count=1$/m);
  assert.match(scope.stdout, /^preview_required=true$/m);
});

test("documentation path containing a newline is one maintenance-only change", (t) => {
  const f = fixture(t);
  f.add("docs/disaster\nrecovery.md");
  const child = f.commit();
  const result = f.run("maintenance_only_hop", child);
  assert.equal(result.status, 0, result.stderr);
  const scope = f.ci(child);
  assert.equal(scope.status, 0, scope.stderr);
  assert.match(scope.stdout, /^changed_count=1$/m);
  assert.match(scope.stdout, /^maintenance_only=true$/m);
});

test("a Git filename with tabs and spaces is not split", (t) => {
  const f = fixture(t);
  f.add("public/letter\t2026 revised.md");
  const child = f.commit();
  assert.equal(f.run("maintenance_only_hop", child).status, 1);
  const scope = f.ci(child);
  assert.match(scope.stdout, /^changed_count=1$/m);
  assert.match(scope.stdout, /^build=true$/m);
});

test("release-only classification refuses an extra path with a newline", (t) => {
  const f = fixture(t);
  const initial = { name: "example", version: "1.0.0" };
  const newVersion = { name: "example", version: "1.0.1" };
  f.add("package.json", JSON.stringify(initial));
  f.add("package-lock.json", JSON.stringify({ version: "1.0.0", packages: { "": initial } }));
  f.commit("seed release baseline");
  const releaseBase = f.git("rev-parse", "HEAD");
  f.add("package.json", JSON.stringify(newVersion));
  f.add("package-lock.json", JSON.stringify({ version: "1.0.1", packages: { "": newVersion } }));
  f.add("public/notice\nunexpected.md");
  const child = f.commit("chore(release): 1.0.1 [skip ci]");
  const result = spawnSync("bash", ["-c", 'source "$1"; release_only_hop "$2" "$3"', "release-test", classifier, releaseBase, child], {
    cwd: f.cwd, encoding: "utf8",
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /PROD_BASE_RELEASE_SCOPE/);
});

test("maintenance-only classification fails closed on Git diff errors", (t) => {
  const f = fixture(t);
  f.add("docs/notes.md");
  const child = f.commit();
  const bin = join(f.cwd, "bin");
  mkdirSync(bin);
  const fakeGit = join(bin, "git");
  writeFileSync(fakeGit, '#!/bin/sh\nif [ "$1" = diff ]; then exit 17; fi\nexec /usr/bin/git "$@"\n');
  execFileSync("chmod", ["+x", fakeGit]);
  const result = f.run("maintenance_only_hop", child, { PATH: bin + ":" + process.env.PATH });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /PROD_BASE_MAINTENANCE_GIT/);
});

test("release-only classification fails closed on Git diff errors", (t) => {
  const f = fixture(t);
  f.add("docs/notes.md");
  const child = f.commit("chore(release): 1.0.1 [skip ci]");
  const bin = join(f.cwd, "bin");
  mkdirSync(bin);
  const fakeGit = join(bin, "git");
  writeFileSync(fakeGit, '#!/bin/sh\nif [ "$1" = diff ]; then exit 17; fi\nexec /usr/bin/git "$@"\n');
  execFileSync("chmod", ["+x", fakeGit]);
  const result = f.run("release_only_hop", child, { PATH: bin + ":" + process.env.PATH });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /PROD_BASE_RELEASE_GIT/);
});
