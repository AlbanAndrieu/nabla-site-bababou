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
  return directory;
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function assertMaintenance(stdout: string, changedCount = 1) {
  assert.match(stdout, /^maintenance_only=true$/m);
  assert.match(stdout, /^application=false$/m);
  assert.match(stdout, /^sast=false$/m);
  assert.match(stdout, /^build=false$/m);
  assert.match(stdout, /^dependencies=false$/m);
  assert.match(stdout, /^preview_required=false$/m);
  assert.match(stdout, new RegExp(`^changed_count=${changedCount}import assert from "node:assert/strict";
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
  return directory;
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function assertMaintenance(stdout: string, changedCount = 1) {
  assert.match(stdout, /^maintenance_only=true$/m);
  assert.match(stdout, /^application=false$/m);
  assert.match(stdout, /^sast=false$/m);
  assert.match(stdout, /^build=false$/m);
, "m"));
}

function assertApplication(
  stdout: string,
  options: {
    sast: boolean;
    dependencies?: boolean;
    previewRequired?: boolean;
  },
) {
  assert.match(stdout, /^maintenance_only=false$/m);
  assert.match(stdout, /^application=true$/m);
  assert.match(stdout, new RegExp(`^sast=${options.sast}$`, "m"));
  assert.match(stdout, /^build=true$/m);
  assert.match(
    stdout,
    new RegExp(`^dependencies=${options.dependencies ?? false}import assert from "node:assert/strict";
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
  return directory;
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function assertMaintenance(stdout: string, changedCount = 1) {
  assert.match(stdout, /^maintenance_only=true$/m);
  assert.match(stdout, /^application=false$/m);
  assert.match(stdout, /^sast=false$/m);
  assert.match(stdout, /^build=false$/m);
  assert.match(stdout, /^dependencies=false$/m);
  assert.match(stdout, /^preview_required=false$/m);
  assert.match(stdout, new RegExp(`^changed_count=${changedCount}import assert from "node:assert/strict";
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
  return directory;
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function assertMaintenance(stdout: string, changedCount = 1) {
  assert.match(stdout, /^maintenance_only=true$/m);
  assert.match(stdout, /^application=false$/m);
  assert.match(stdout, /^sast=false$/m);
  assert.match(stdout, /^build=false$/m);
, "m"));
}

function assertApplication(
  stdout: string,
  options: {
    sast: boolean;
    dependencies?: boolean;
    previewRequired?: boolean;
  },
) {
  assert.match(stdout, /^maintenance_only=false$/m);
  assert.match(stdout, /^application=true$/m);
  assert.match(stdout, new RegExp(`^sast=${options.sast}$`, "m"));
  assert.match(stdout, /^build=true$/m);
, "m"),
  );
  assert.match(
    stdout,
    new RegExp(`^preview_required=${options.previewRequired ?? true}import assert from "node:assert/strict";
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
  return directory;
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function assertMaintenance(stdout: string, changedCount = 1) {
  assert.match(stdout, /^maintenance_only=true$/m);
  assert.match(stdout, /^application=false$/m);
  assert.match(stdout, /^sast=false$/m);
  assert.match(stdout, /^build=false$/m);
  assert.match(stdout, /^dependencies=false$/m);
  assert.match(stdout, /^preview_required=false$/m);
  assert.match(stdout, new RegExp(`^changed_count=${changedCount}import assert from "node:assert/strict";
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
  return directory;
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function assertMaintenance(stdout: string, changedCount = 1) {
  assert.match(stdout, /^maintenance_only=true$/m);
  assert.match(stdout, /^application=false$/m);
  assert.match(stdout, /^sast=false$/m);
  assert.match(stdout, /^build=false$/m);
, "m"));
}

function assertApplication(
  stdout: string,
  options: {
    sast: boolean;
    dependencies?: boolean;
    previewRequired?: boolean;
  },
) {
  assert.match(stdout, /^maintenance_only=false$/m);
  assert.match(stdout, /^application=true$/m);
  assert.match(stdout, new RegExp(`^sast=${options.sast}$`, "m"));
  assert.match(stdout, /^build=true$/m);
, "m"),
  );
}

test("known quality orchestration remains maintenance-only", async (t) => {
  const directory = await createRepository("bababou-ci-scope-maintenance-");
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
  assertMaintenance(result.stdout);
});

test("deleted runtime files still require application build and SAST", async (t) => {
  const directory = await createRepository("bababou-ci-scope-delete-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(
    join(directory, "app", "runtime.ts"),
    "export const runtime = true;\n",
  );
  git(directory, "add", "app/runtime.ts");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  git(directory, "rm", "--quiet", "app/runtime.ts");
  git(directory, "commit", "--quiet", "-m", "delete runtime");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assertApplication(result.stdout, { sast: true });
  assert.match(result.stdout, /^changed_count=1$/m);
});

test(
  "unknown deployment configuration fails safe to application build without fake SAST work",
  async (t) => {
    const directory = await createRepository("bababou-ci-scope-vercel-");
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
    assertApplication(result.stdout, { sast: false });
    assert.match(result.stdout, /^changed_count=1$/m);
  },
);

test("dependency changes preserve the Bababou-specific Snyk signal", async (t) => {
  const directory = await createRepository("bababou-ci-scope-dependencies-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(
    join(directory, "package.json"),
    '{"name":"fixture","version":"1.0.0"}\n',
  );
  git(directory, "add", "package.json");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  await writeFile(
    join(directory, "package.json"),
    '{"name":"fixture","version":"1.0.1"}\n',
  );
  git(directory, "add", "package.json");
  git(directory, "commit", "--quiet", "-m", "dependency metadata");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assertApplication(result.stdout, { sast: false, dependencies: true });
  assert.match(result.stdout, /^changed_count=1$/m);
});

test("baseline classifier changes require full quality but not a Vercel Preview", async (t) => {
  const directory = await createRepository("bababou-ci-scope-classifier-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  await mkdir(join(directory, "scripts", "lib"), { recursive: true });
  await writeFile(
    join(
      directory,
      "scripts",
      "lib",
      "production-baseline-classification.sh",
    ),
    "# policy change\n",
  );
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "refactor: baseline classifier");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assertApplication(result.stdout, {
    sast: false,
    previewRequired: false,
  });
  assert.match(result.stdout, /^changed_count=1$/m);
});

test("empty diffs fail safe instead of silently using the maintenance path", async (t) => {
  const directory = await createRepository("bababou-ci-scope-empty-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");
  git(directory, "commit", "--quiet", "--allow-empty", "-m", "empty");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  assertApplication(result.stdout, { sast: true });
  assert.match(result.stdout, /^changed_count=0$/m);
});
