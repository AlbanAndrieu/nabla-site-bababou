import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const qualityScopeScript = fileURLToPath(
  new URL("../scripts/ci-quality-scope.sh", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function createRepository(prefix: string) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  git(directory, "init", "--quiet");
  git(directory, "config", "user.name", "Quality Scope Test");
  git(directory, "config", "user.email", "quality-scope@example.invalid");
  return directory;
}

function classify(directory: string, baseSha: string) {
  return spawnSync("bash", [qualityScopeScript], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      QUALITY_SCOPE_BASE_REF: baseSha,
      QUALITY_SCOPE_HEAD_REF: "HEAD",
    },
  });
}

test("known quality orchestration remains maintenance-only", async (t) => {
  const directory = await createRepository("bababou-quality-scope-maintenance-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  await mkdir(join(directory, "scripts"), { recursive: true });
  await writeFile(
    join(directory, "scripts", "publish-vercel-preview-checkpoint.sh"),
    "#!/usr/bin/env bash\necho checkpoint\n",
  );
  git(directory, "add", "scripts/publish-vercel-preview-checkpoint.sh");
  git(directory, "commit", "--quiet", "-m", "maintenance");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /full_project=false/);
  assert.match(result.stdout, /sast=false/);
  assert.match(result.stdout, /dependencies=false/);
  assert.match(result.stdout, /changed_count=1/);
});

test("deleted runtime files still require the full project quality gate", async (t) => {
  const directory = await createRepository("bababou-quality-scope-delete-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(join(directory, "app", "runtime.ts"), "export const runtime = true;\n");
  git(directory, "add", "app/runtime.ts");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  git(directory, "rm", "--quiet", "app/runtime.ts");
  git(directory, "commit", "--quiet", "-m", "delete runtime");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /full_project=true/);
  assert.match(result.stdout, /sast=true/);
  assert.match(result.stdout, /dependencies=false/);
  assert.match(result.stdout, /changed_count=1/);
});

test("unknown deployment configuration fails safe to the full project gate", async (t) => {
  const directory = await createRepository("bababou-quality-scope-vercel-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  await writeFile(join(directory, "vercel.json"), "{}\n");
  git(directory, "add", "vercel.json");
  git(directory, "commit", "--quiet", "-m", "deployment config");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /full_project=true/);
  assert.match(result.stdout, /changed_count=1/);
});

test("empty diffs fail safe instead of silently using the maintenance path", async (t) => {
  const directory = await createRepository("bababou-quality-scope-empty-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");
  git(directory, "commit", "--quiet", "--allow-empty", "-m", "empty");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /full_project=true/);
  assert.match(result.stdout, /sast=true/);
  assert.match(result.stdout, /changed_count=0/);
});
