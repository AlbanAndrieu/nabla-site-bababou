import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const scopeScript = join(root, "scripts/ci-scope.sh");
const baselineScript = join(root, "scripts/lib/production-baseline-classification.sh");
const read = (path) => readFileSync(join(root, path), "utf8");

function fixture(t, path) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-scope-parity-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "scope@example.invalid");
  git("config", "user.name", "Scope Fixture");
  writeFileSync(join(cwd, "baseline.txt"), "baseline\n");
  git("add", "--", "baseline.txt");
  git("commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD");
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), "changed\n");
  git("add", "--", path);
  git("commit", "-qm", "change");
  const head = git("rev-parse", "HEAD");
  const ci = spawnSync("bash", [scopeScript, base, head], { cwd, encoding: "utf8" });
  const baseline = spawnSync("bash", [
    "-c", 'source "$1"; maintenance_only_hop "$2" "$3"',
    "scope-test", baselineScript, base, head,
  ], { cwd, encoding: "utf8" });
  return { ci, baseline };
}

test("public Markdown is deploy-relevant for both CI and production baseline", (t) => {
  for (const path of ["public/README.md", "public/legal/notice.md"]) {
    const { ci, baseline } = fixture(t, path);
    assert.equal(ci.status, 0, ci.stderr);
    assert.match(ci.stdout, /maintenance_only=false/);
    assert.match(ci.stdout, /build=true/);
    assert.match(ci.stdout, /preview_required=true/);
    assert.equal(baseline.status, 1, "Unexpected inherited baseline for " + path);
    assert.match(baseline.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
  }
});

test("nested application Markdown requires the same security gates", (t) => {
  const { ci, baseline } = fixture(t, "app/content/notice.md");
  assert.equal(ci.status, 0, ci.stderr);
  assert.match(ci.stdout, /preview_required=true/);
  assert.match(ci.stdout, /build=true/);
  assert.equal(baseline.status, 1);
});

test("root README and internal documentation remain maintenance-only", (t) => {
  for (const path of ["README.md", "docs/incident/diagnostic.md"]) {
    const { ci, baseline } = fixture(t, path);
    assert.equal(ci.status, 0, ci.stderr);
    assert.match(ci.stdout, /maintenance_only=true/);
    assert.match(ci.stdout, /build=false/);
    assert.match(ci.stdout, /preview_required=false/);
    assert.equal(baseline.status, 0, baseline.stderr);
  }
});

test("the on-demand Preview classifier cannot treat nested Markdown as safe", () => {
  const workflow = read(".github/workflows/vercel-preview.yml");
  assert.match(workflow, /filename\.endsWith\('\.md'\) && !filename\.includes\('\/'\)/);
  assert.doesNotMatch(workflow, /^\s*filename\.endsWith\('\.md'\) \|\|$/m);
});

test("Vercel's ignored-build script cannot blanket-ignore Markdown", () => {
  const script = read("scripts/vercel-ignore-build.sh");
  assert.match(script, /if \[\[ "\$file" != \*\/\* \]\]/);
  assert.match(script, /git -c core\.quotePath=false diff .* -z/);
});
