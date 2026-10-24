import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vercelScript = join(root, "scripts/vercel-ignore-build.sh");
const ciScript = join(root, "scripts/ci-scope.sh");
const baselineScript = join(root, "scripts/lib/production-baseline-classification.sh");

function renamedRepo(t, source, dest) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-rename-scope-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "rename-test@example.invalid");
  git("config", "user.name", "Rename Test");
  mkdirSync(dirname(join(cwd, source)), { recursive: true });
  writeFileSync(join(cwd, source), "content\n");
  git("add", "--", source);
  git("commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD");
  mkdirSync(dirname(join(cwd, dest)), { recursive: true });
  git("mv", "--", source, dest);
  git("commit", "-qm", "rename");
  const head = git("rev-parse", "HEAD");
  return {
    vercel: () => spawnSync("bash", [vercelScript], {
      cwd, encoding: "utf8",
      env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: base, VERCEL_GIT_COMMIT_REF: "master" },
    }),
    ci: () => spawnSync("bash", [ciScript, base, head], { cwd, encoding: "utf8" }),
    baseline: () => spawnSync(
      "bash",
      ["-c", 'source "$1"; maintenance_only_hop "$2" "$3"', "rename-test", baselineScript, base, head],
      { cwd, encoding: "utf8" },
    ),
  };
}

test("a public asset renamed into documentation still requires deployment gates", (t) => {
  for (const source of ["public/README.md", "public/subdir/letter.md", "public/letter with spaces.md"]) {
    const target = "docs/" + source.slice("public/".length);
    const f = renamedRepo(t, source, target);
    const vercel = f.vercel();
    assert.equal(vercel.status, 1, vercel.stderr + vercel.stdout);
    assert.match(vercel.stdout, /Deploy-relevant change detected/);
    const ci = f.ci();
    assert.equal(ci.status, 0, ci.stderr);
    for (const expected of ["maintenance_only=false", "build=true", "preview_required=true"]) {
      assert.ok(ci.stdout.includes(expected), "Missing: " + expected);
    }
    const baseline = f.baseline();
    assert.equal(baseline.status, 1, baseline.stdout + baseline.stderr);
    assert.match(baseline.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
  }
});

test("moving only internal Markdown within docs remains maintenance-only", (t) => {
  const f = renamedRepo(t, "docs/old.md", "docs/new.md");
  assert.equal(f.vercel().status, 0);
  const ci = f.ci();
  assert.equal(ci.status, 0, ci.stderr);
  assert.match(ci.stdout, /maintenance_only=true/);
  assert.match(ci.stdout, /preview_required=false/);
  assert.equal(f.baseline().status, 0);
});

test("renaming docs into a served public path requires a deployment", (t) => {
  const f = renamedRepo(t, "docs/letter.md", "public/letter.md");
  assert.equal(f.vercel().status, 1);
  assert.match(f.ci().stdout, /preview_required=true/);
  assert.equal(f.baseline().status, 1);
});

test("on-demand Preview evaluates original and destination of a rename", () => {
  const workflow = readFileSync(join(root, ".github/workflows/vercel-preview.yml"), "utf8");
  assert.match(workflow, /github\.paginate\(github\.rest\.pulls\.listFiles/);
  assert.match(workflow, /\.flatMap\(\(file\) =>/);
  assert.match(workflow, /file\.previous_filename/);
  assert.match(workflow, /file\.status === 'renamed'/);
  assert.match(workflow, /!filename \|\| !safeOnly\(filename\)/);
});

test("all local Git scope collectors disable rename detection", () => {
  for (const path of [
    "scripts/vercel-ignore-build.sh",
    "scripts/ci-scope.sh",
    "scripts/lib/production-baseline-classification.sh",
  ]) {
    const content = readFileSync(join(root, path), "utf8");
    assert.match(content, /git (?:-c core\.quotePath=false )?diff --no-renames /);
    assert.doesNotMatch(content, /git diff --name-only --diff-filter=ACMRD/);
  }
});
