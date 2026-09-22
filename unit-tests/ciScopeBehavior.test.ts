import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ciScopeScript = fileURLToPath(
  new URL("../scripts/ci-scope.sh", import.meta.url),
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
  git(directory, "config", "user.name", "CI Scope Test");
  git(directory, "config", "user.email", "ci-scope@example.invalid");
  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  return { directory, baseSha: git(directory, "rev-parse", "HEAD") };
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function expectScope(
  stdout: string,
  expected: {
    maintenance: boolean;
    application: boolean;
    sast: boolean;
    build: boolean;
    preview: boolean;
    zap?: boolean;
    dependencies?: boolean;
    count?: number;
  },
) {
  assert.match(stdout, new RegExp(`^maintenance_only=${expected.maintenance}$`, "m"));
  assert.match(stdout, new RegExp(`^application=${expected.application}$`, "m"));
  assert.match(stdout, new RegExp(`^sast=${expected.sast}$`, "m"));
  assert.match(stdout, new RegExp(`^build=${expected.build}$`, "m"));
  assert.match(stdout, new RegExp(`^preview_required=${expected.preview}$`, "m"));
  assert.match(stdout, new RegExp(`^zap_bootstrap=${expected.zap ?? false}$`, "m"));
  assert.match(
    stdout,
    new RegExp(`^dependencies=${expected.dependencies ?? false}$`, "m"),
  );
  assert.match(stdout, new RegExp(`^changed_count=${expected.count ?? 1}$`, "m"));
}

test("quality orchestration remains maintenance-only", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-maint-");
  t.after(async () => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "scripts"), { recursive: true });
  await writeFile(join(directory, "scripts", "agent-publish.sh"), "#!/bin/sh\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "maintenance");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
});

test("workflow changes keep SAST but skip application build and Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-workflow-");
  t.after(async () => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(join(directory, ".github", "workflows", "ci.yml"), "name: CI\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "workflow");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: true,
    build: false,
    preview: false,
  });
});

test("ZAP workflow changes expose bootstrap without allocating Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-zap-");
  t.after(async () => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(directory, ".github", "workflows", "zap-preview.yml"),
    "name: ZAP Preview\n",
  );
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "zap workflow");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: true,
    build: false,
    preview: false,
    zap: true,
  });
});

test("runtime changes require application build, SAST and Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-runtime-");
  t.after(async () => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(join(directory, "app", "page.tsx"), "export default function Page() {}\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "runtime");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
  });
});

test("dependency changes retain Bababou Snyk signal", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-deps-");
  t.after(async () => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "package.json"), '{"name":"fixture"}\n');
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "dependencies");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
    dependencies: true,
  });
});

test("empty diffs fail safe", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-empty-");
  t.after(async () => rm(directory, { recursive: true, force: true }));
  git(directory, "commit", "--quiet", "--allow-empty", "-m", "empty");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
    count: 0,
  });
});
