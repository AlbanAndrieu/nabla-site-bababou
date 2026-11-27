import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
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

const scopePath = fileURLToPath(
  new URL("../scripts/ci-scope.sh", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

test("post-202 local-first policies compose without forcing a Preview", async () => {
  const [scope, ci, onDemand, agentGate] = await Promise.all([
    readFile(scopePath, "utf8"),
    readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/workflows/vercel-preview.yml", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../scripts/agent-quality-gate.sh", import.meta.url),
      "utf8",
    ),
  ]);

  const classifierPath = "scripts/lib/production-baseline-classification.sh";
  const maintenanceStart = scope.indexOf("is_maintenance_only_path() {");
  const previewStart = scope.indexOf("is_preview_safe_path() {");
  // Changed paths are read NUL-delimited since filenames may contain newlines.
  const changedFilesStart = scope.indexOf('mapfile -d "" -t CHANGED_FILES');

  assert.ok(maintenanceStart >= 0 && previewStart > maintenanceStart);
  assert.ok(changedFilesStart > previewStart);
  assert.ok(
    !scope.slice(maintenanceStart, previewStart).includes(classifierPath),
  );
  assert.ok(
    scope.slice(previewStart, changedFilesStart).includes(classifierPath),
  );

  assert.match(ci, /needs\.quality\.outputs\.preview_required == 'true'/);
  assert.match(ci, /needs\.quality\.outputs\.zap_bootstrap/);
  assert.doesNotMatch(ci, /github\.rest\.pulls\.listFiles/);
  assert.doesNotMatch(ci, /const safeOnly/);
  assert.doesNotMatch(ci, /deployRelevant/);

  assert.ok(onDemand.includes(`filename === '${classifierPath}'`));
  assert.ok(onDemand.includes("filename === 'scripts/check_code_size.py'"));
  assert.match(onDemand, /publish-vercel-preview-checkpoint\.sh/);
  assert.doesNotMatch(onDemand, /git push --force origin/);
  assert.doesNotMatch(onDemand, /forceCheckpoint/);

  assert.match(agentGate, /QG_CI_SKIP_DIRECTIVE/);
  assert.match(agentGate, /skip-checks:/);
});

test("baseline classifier change is policy-only and Preview-safe", async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), "bababou-post202-scope-"));
  t.after(async () => rm(cwd, { recursive: true, force: true }));

  await mkdir(join(cwd, "scripts", "lib"), { recursive: true });
  await writeFile(
    join(cwd, "scripts", "ci-scope.sh"),
    await readFile(scopePath, "utf8"),
  );
  await chmod(join(cwd, "scripts", "ci-scope.sh"), 0o755);

  git(cwd, "init", "--quiet");
  git(cwd, "config", "user.name", "Local First Contract");
  git(cwd, "config", "user.email", "local-first@example.invalid");
  await writeFile(join(cwd, "README.md"), "base\n");
  git(cwd, "add", ".");
  git(cwd, "commit", "--quiet", "-m", "base");
  const base = git(cwd, "rev-parse", "HEAD");

  await writeFile(
    join(cwd, "scripts", "lib", "production-baseline-classification.sh"),
    "# policy-only change\n",
  );
  git(cwd, "add", ".");
  git(cwd, "commit", "--quiet", "-m", "refactor: baseline policy");

  const result = spawnSync("bash", ["scripts/ci-scope.sh", base, "HEAD"], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^maintenance_only=false$/m);
  assert.match(result.stdout, /^application=false$/m);
  assert.match(result.stdout, /^sast=false$/m);
  assert.match(result.stdout, /^build=false$/m);
  assert.match(result.stdout, /^preview_required=false$/m);
  assert.match(result.stdout, /^zap_bootstrap=false$/m);
});
