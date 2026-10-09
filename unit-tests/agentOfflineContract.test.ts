import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("offline L1 checks every local path without implicit truncation", async () => {
  const [script, justfile] = await Promise.all([
    read("scripts/agent-offline-check.sh"),
    read("justfile"),
  ]);
  assert.match(script, /AGENT_OFFLINE_MAX_PATHS:-0/);
  assert.match(script, /git ls-files --others --exclude-standard/);
  assert.match(script, /git ls-files/);
  assert.match(script, /OFFLINE_BASE_UNAVAILABLE/);
  assert.match(script, /OFFLINE_LIMIT_EXCEEDED/);
  assert.match(script, /bash -n/);
  assert.match(script, /ast\.parse/);
  assert.match(script, /git diff --cached --check/);
  assert.match(script, /NOT_RUN: formatter, Betterleaks/);
  assert.doesNotMatch(script, /head -n|sed -n ['"]1,200|curl |git fetch|git clone/);
  assert.match(justfile, /offline-l1:\n    bash scripts\/agent-offline-check\.sh/);
});

test("offline fallback covers 205 files and fails closed on syntax and explicit limits", async () => {
  const root = await mkdtemp(join(tmpdir(), "bababou-offline-"));
  const script = fileURLToPath(
    new URL("../scripts/agent-offline-check.sh", import.meta.url),
  );
  try {
    const git = spawnSync("git", ["init", "-q", root], {
      encoding: "utf8",
    });
    assert.equal(git.status, 0, git.stderr);

    for (let i = 0; i < 205; i++) {
      await writeFile(join(root, `case-${i}.sh`), "true\n");
    }
    const run = (limit: string) =>
      spawnSync("bash", [script], {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          QUALITY_BASE_REF: "refs/heads/absent",
          AGENT_OFFLINE_MAX_PATHS: limit,
        },
      });

    const valid = run("0");
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /paths=205 syntax_checked=205/);
    assert.match(valid.stderr, /OFFLINE_BASE_UNAVAILABLE/);
    assert.match(valid.stdout, /NOT_RUN: formatter, Betterleaks/);
    assert.ok(
      valid.stdout.split("\n").length <= 5,
      "success diagnostics stay concise",
    );

    const limited = run("200");
    assert.equal(limited.status, 2);
    assert.match(limited.stderr, /OFFLINE_LIMIT_EXCEEDED/);

    await writeFile(join(root, "case-204.sh"), "if then\n");
    const invalid = run("0");
    assert.notEqual(invalid.status, 0);
    assert.doesNotMatch(invalid.stdout, /OFFLINE_L1_PASS/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
