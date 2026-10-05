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

const gatePath = fileURLToPath(
  new URL("../scripts/agent-quality-gate.sh", import.meta.url),
);
const supportPath = fileURLToPath(
  new URL("../scripts/lib/agent-quality-support.sh", import.meta.url),
);
const codeSizePath = fileURLToPath(
  new URL("../scripts/check_code_size.py", import.meta.url),
);
const ciScopePath = fileURLToPath(
  new URL("../scripts/ci-scope.sh", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), "bababou-ci-skip-guard-"));
  await mkdir(join(directory, "scripts", "lib"), { recursive: true });
  await writeFile(
    join(directory, "scripts", "agent-quality-gate.sh"),
    await readFile(gatePath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "lib", "agent-quality-support.sh"),
    await readFile(supportPath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "check_code_size.py"),
    await readFile(codeSizePath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "ci-scope.sh"),
    await readFile(ciScopePath, "utf8"),
  );
  await chmod(join(directory, "scripts", "agent-quality-gate.sh"), 0o755);

  git(directory, "init", "--quiet");
  git(directory, "config", "user.name", "CI Skip Guard Test");
  git(directory, "config", "user.email", "ci-skip-guard@example.invalid");
  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");
  return { directory, baseSha };
}

function preflight(directory: string, baseSha: string) {
  return spawnSync("bash", ["scripts/agent-quality-gate.sh", "--preflight"], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      QUALITY_BASE_REF: baseSha,
    },
  });
}

test("normal PR commits pass the dependency-free CI skip-directive guard", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await mkdir(join(fixture.directory, "docs"), { recursive: true });
  await writeFile(join(fixture.directory, "docs", "note.md"), "maintenance\n");
  git(fixture.directory, "add", ".");
  git(fixture.directory, "commit", "--quiet", "-m", "docs: maintenance");

  const result = preflight(fixture.directory, fixture.baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /CI skip-directive guard/);
  assert.match(
    result.stdout,
    /Agent preflight passed without installing dependencies/,
  );
});

test("GitHub bracketed CI skip directives are rejected before dependency install", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  git(
    fixture.directory,
    "commit",
    "--quiet",
    "--allow-empty",
    "-m",
    "docs: attempt bypass [skip ci]",
  );

  const result = preflight(fixture.directory, fixture.baseSha);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /QG_CI_SKIP_DIRECTIVE/);
});

test("GitHub skip-checks trailer is rejected before dependency install", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  git(
    fixture.directory,
    "commit",
    "--quiet",
    "--allow-empty",
    "-m",
    "docs: attempt trailer bypass",
    "-m",
    "skip-checks: true",
  );

  const result = preflight(fixture.directory, fixture.baseSha);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /QG_CI_SKIP_DIRECTIVE/);
});
