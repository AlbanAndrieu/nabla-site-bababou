import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("offline agent script is maintenance-only across CI, Preview and baseline", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "bababou-offline-scope-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const script = fileURLToPath(
    new URL("../scripts/ci-scope.sh", import.meta.url),
  );
  const read = (path: string) =>
    readFile(new URL("../" + path, import.meta.url), "utf8");
  const [scope, preview, baseline] = await Promise.all([
    read("scripts/ci-scope.sh"),
    read(".github/workflows/vercel-preview.yml"),
    read("scripts/lib/production-baseline-classification.sh"),
  ]);
  const path = "scripts/agent-offline-check.sh";
  assert.equal(scope.split(path).length - 1, 1);
  assert.ok(preview.includes("filename === '" + path + "'"));
  assert.ok(baseline.includes(path));

  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.name", "CI Scope Test");
  git("config", "user.email", "ci-scope@example.invalid");
  await writeFile(join(root, "README.md"), "base\n");
  git("add", ".");
  git("commit", "-qm", "base");
  const baseSha = git("rev-parse", "HEAD");
  await mkdir(join(root, "scripts"));
  await writeFile(join(root, path), "true\n");
  git("add", ".");
  git("commit", "-qm", "offline script");
  const result = spawnSync("bash", [script, baseSha, "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  for (const key of [
    "maintenance_only=true",
    "application=false",
    "sast=false",
    "build=false",
    "preview_required=false",
    "changed_count=1",
  ]) {
    assert.ok(result.stdout.includes(key), key);
  }
});

test("CI scope fails closed when git diff fails instead of misclassifying changes", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "bababou-scope-fail-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.name", "CI Scope Test");
  git("config", "user.email", "ci-scope@example.invalid");
  await writeFile(join(root, "README.md"), "initial\n");
  git("add", ".");
  git("commit", "-qm", "base");
  const baseSha = git("rev-parse", "HEAD");
  const script = fileURLToPath(
    new URL("../scripts/ci-scope.sh", import.meta.url),
  );
  const shim = join(root, "git");
  await writeFile(
    shim,
    '#!/bin/sh\nif [ "$1" = diff ]; then exit 42; fi\nexec /usr/bin/git "$@"\n',
  );
  await chmod(shim, 0o755);
  const result = spawnSync("bash", [script, baseSha, "HEAD"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PATH: root + ":" + process.env.PATH },
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /CI_SCOPE_GIT_FAILED/);
  assert.doesNotMatch(result.stdout, /maintenance_only=true/);
});
