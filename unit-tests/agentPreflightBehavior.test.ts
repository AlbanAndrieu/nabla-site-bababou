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
import { fileURLToPath } from "node:url";
import test from "node:test";

const gatePath = fileURLToPath(
  new URL("../scripts/agent-quality-gate.sh", import.meta.url),
);
const supportPath = fileURLToPath(
  new URL("../scripts/lib/agent-quality-support.sh", import.meta.url),
);
const scopePath = fileURLToPath(
  new URL("../scripts/ci-scope.sh", import.meta.url),
);
const codeSizePath = fileURLToPath(
  new URL("../scripts/check_code_size.py", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), "bababou-agent-preflight-"));
  await mkdir(join(directory, "scripts", "lib"), { recursive: true });
  await mkdir(join(directory, "bin"), { recursive: true });

  await writeFile(
    join(directory, "scripts", "agent-quality-gate.sh"),
    await readFile(gatePath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "lib", "agent-quality-support.sh"),
    await readFile(supportPath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "ci-scope.sh"),
    await readFile(scopePath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "check_code_size.py"),
    await readFile(codeSizePath, "utf8"),
  );

  for (const command of ["npm", "pre-commit"]) {
    const path = join(directory, "bin", command);
    await writeFile(
      path,
      `#!/usr/bin/env bash
echo "${command} must not run during --preflight" >&2
exit 99
`,
    );
    await chmod(path, 0o755);
  }

  for (const path of [
    join(directory, "scripts", "agent-quality-gate.sh"),
    join(directory, "scripts", "ci-scope.sh"),
  ]) {
    await chmod(path, 0o755);
  }

  git(directory, "init", "--quiet");
  git(directory, "config", "user.name", "Agent Preflight Test");
  git(directory, "config", "user.email", "agent-preflight@example.invalid");
  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "base");

  return {
    directory,
    baseSha: git(directory, "rev-parse", "HEAD"),
  };
}

function runPreflight(directory: string, baseSha: string) {
  return spawnSync("bash", ["scripts/agent-quality-gate.sh", "--preflight"], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${join(directory, "bin")}:${process.env.PATH ?? ""}`,
      QUALITY_BASE_REF: baseSha,
    },
  });
}

test("dependency-free preflight reports maintenance worktree scope", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await mkdir(join(fixture.directory, "docs"), { recursive: true });
  await writeFile(
    join(fixture.directory, "docs", "roadmap-note.md"),
    "local-only change\n",
  );

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^maintenance_only=true$/m);
  assert.match(result.stdout, /^application=false$/m);
  assert.match(result.stdout, /^sast=false$/m);
  assert.match(result.stdout, /^build=false$/m);
  assert.match(result.stdout, /^preview_required=false$/m);
  assert.match(
    result.stdout,
    /Scope source: committed \+ staged \+ unstaged \+ untracked/,
  );
  assert.match(
    result.stdout,
    /Agent preflight passed without installing dependencies/,
  );
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight exposes deploy-relevant work before commit", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await mkdir(join(fixture.directory, "app"), { recursive: true });
  await writeFile(
    join(fixture.directory, "app", "page.tsx"),
    "export default function Page() { return null; }\n",
  );

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^maintenance_only=false$/m);
  assert.match(result.stdout, /^application=true$/m);
  assert.match(result.stdout, /^sast=true$/m);
  assert.match(result.stdout, /^build=true$/m);
  assert.match(result.stdout, /^preview_required=true$/m);
});

test("dependency-free preflight rejects malformed changed shell before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  const brokenScript = join(fixture.directory, "scripts", "broken.sh");
  await writeFile(
    brokenScript,
    "#!/usr/bin/env bash\nif [[ true ]]; then\necho broken\n",
  );
  await chmod(brokenScript, 0o755);

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /changed shell syntax/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight rejects untracked whitespace before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await mkdir(join(fixture.directory, "docs"), { recursive: true });
  await writeFile(join(fixture.directory, "docs", "bad-whitespace.md"), "trailing space \n");

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /untracked diff whitespace/);
  assert.match(result.stderr, /trailing whitespace/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test(
  "dependency-free preflight checks untracked files outside the destructive-diff guard",
  async (t) => {
    const fixture = await createFixture();
    t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

    await writeFile(
      join(fixture.directory, "package-lock.json"),
      '{"lockfileVersion":3} \n',
    );

    const result = runPreflight(fixture.directory, fixture.baseSha);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /untracked diff whitespace/);
    assert.match(result.stderr, /package-lock\.json/);
    assert.match(result.stderr, /trailing whitespace/);
    assert.doesNotMatch(result.stderr, /must not run during --preflight/);
  },
);

test("dependency-free preflight rejects CI skip directives before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await writeFile(join(fixture.directory, "README.md"), "head change\n");
  git(fixture.directory, "add", "README.md");
  git(fixture.directory, "commit", "--quiet", "-m", "maintenance [skip ci]");

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /QG_CI_SKIP_DIRECTIVE/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight rejects skip-checks trailers before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await writeFile(join(fixture.directory, "README.md"), "head change\n");
  git(fixture.directory, "add", "README.md");
  git(
    fixture.directory,
    "commit",
    "--quiet",
    "-m",
    "maintenance",
    "-m",
    "skip-checks: true",
  );

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /QG_CI_SKIP_DIRECTIVE/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight rejects missing executable bits before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  const script = join(fixture.directory, "scripts", "not-executable.sh");
  await writeFile(script, "#!/usr/bin/env bash\necho test\n");
  await chmod(script, 0o644);
  git(fixture.directory, "add", "scripts/not-executable.sh");

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /QG_EXEC_BIT/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight rejects untracked scripts without executable bits", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  const script = join(fixture.directory, "scripts", "untracked-not-executable.sh");
  await writeFile(script, "#!/usr/bin/env bash\necho test\n");
  await chmod(script, 0o644);

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /QG_EXEC_BIT/);
  assert.match(result.stderr, /untracked/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight rejects a stale comparison base before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  const staleBase = fixture.baseSha;
  await writeFile(join(fixture.directory, "README.md"), "head change\n");
  git(fixture.directory, "add", "README.md");
  git(fixture.directory, "commit", "--quiet", "-m", "head");

  const treeSha = git(fixture.directory, "write-tree");
  const unrelatedSha = git(
    fixture.directory,
    "commit-tree",
    treeSha,
    "-m",
    "unrelated",
  );
  git(fixture.directory, "reset", "--hard", "--quiet", unrelatedSha);

  const result = runPreflight(fixture.directory, staleBase);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /QG_BASE_STALE/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("dependency-free preflight rejects oversized source before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await mkdir(join(fixture.directory, "app"), { recursive: true });
  await writeFile(
    join(fixture.directory, "app", "oversized.ts"),
    Array.from({ length: 601 }, (_, index) => `export const line${index} = ${index};`).join("\n") +
      "\n",
  );

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /baseline-aware code-size report/);
  assert.match(result.stderr, /oversized\.ts: 601 lines exceeds 600/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});

test("agent shell classifier includes the local P0 checkpoint", async () => {
  const result = spawnSync(
    "bash",
    [
      "-c",
      'source "$SUPPORT_PATH"; classify_changed_files scripts/agent-p0-check.sh; printf "%s\\n" "$agent_gate_changed" "${AGENT_GATE_SHELL_FILES[@]}"',
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        SUPPORT_PATH: supportPath,
      },
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^true$/m);
  assert.match(result.stdout, /^scripts\/agent-p0-check\.sh$/m);
});

test("dependency-free preflight rejects malformed Python before npm", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  await writeFile(
    join(fixture.directory, "scripts", "broken.py"),
    "def broken(:\n    pass\n",
  );

  const result = runPreflight(fixture.directory, fixture.baseSha);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /changed Python syntax/);
  assert.doesNotMatch(result.stderr, /must not run during --preflight/);
});
