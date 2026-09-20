import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const script = join(repositoryRoot, "scripts/check_code_size.py");

function runCodeSize(args: string[], cwd = repositoryRoot) {
  return spawnSync("python3", [script, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function runGit(cwd: string, ...args: string[]) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
}

test("code-size gate warns without failing between soft and hard limits", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bababou-code-size-"));
  const source = join(directory, "warning.ts");
  try {
    await writeFile(source, "one\ntwo\nthree\nfour\n", "utf8");
    const result = runCodeSize(["--warn", "3", "--fail", "5", source]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /WARNING .*warning\.ts: 4 lines exceeds 3/);
    assert.match(result.stdout, /1 warning\(s\), 0 error\(s\)/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("code-size gate fails a new source file above the hard limit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bababou-code-size-"));
  const source = join(directory, "oversized.ts");
  try {
    await writeFile(source, "one\ntwo\nthree\nfour\nfive\nsix\n", "utf8");
    const result = runCodeSize(["--warn", "3", "--fail", "5", source]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /ERROR .*oversized\.ts: 6 lines exceeds 5/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("code-size gate grandfathers bounded legacy size but rejects excess growth", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bababou-code-size-git-"));
  try {
    runGit(directory, "init", "-q");
    runGit(directory, "config", "user.email", "quality-gate@example.invalid");
    runGit(directory, "config", "user.name", "Quality Gate Test");
    await writeFile(join(directory, "legacy.ts"), "1\n2\n3\n4\n5\n6\n", "utf8");
    runGit(directory, "add", "legacy.ts");
    runGit(directory, "commit", "-qm", "baseline");

    const unchanged = runCodeSize(
      ["--warn", "3", "--fail", "5", "--baseline-ref", "HEAD", "legacy.ts"],
      directory,
    );
    assert.equal(unchanged.status, 0, unchanged.stderr);
    assert.match(unchanged.stderr, /baseline 6, legacy limit 6/);

    await writeFile(join(directory, "legacy.ts"), "1\n2\n3\n4\n5\n6\n7\n", "utf8");
    const growth = runCodeSize(
      [
        "--warn", "3", "--fail", "5",
        "--baseline-ref", "HEAD",
        "--legacy-growth-percent", "2",
        "legacy.ts",
      ],
      directory,
    );
    assert.equal(growth.status, 1);
    assert.match(growth.stderr, /baseline: 6/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("agent gate runs the baseline-aware report before npm-backed validation", async () => {
  const { readFile } = await import("node:fs/promises");
  const gate = await readFile(
    join(repositoryRoot, "scripts/agent-quality-gate.sh"),
    "utf8",
  );
  assert.match(gate, /run_compact_report "baseline-aware code-size report"/);
  assert.match(gate, /python3 scripts\/check_code_size\.py/);
  assert.match(gate, /--baseline-ref "\$\{BASE_REF\}"/);
  const report = gate.indexOf("baseline-aware code-size report");
  const strictNpmCheck = gate.lastIndexOf("command -v npm");
  assert.ok(report >= 0);
  assert.ok(strictNpmCheck > report);
});
