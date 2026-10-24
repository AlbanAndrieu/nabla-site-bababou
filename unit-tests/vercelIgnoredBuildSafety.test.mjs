import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/vercel-ignore-build.sh", import.meta.url));

function fixture(t, path, { includeDocsCommit = false } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), "bababou-vercel-safety-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "vercel-test@example.invalid");
  git("config", "user.name", "Vercel Test");
  writeFileSync(join(cwd, "baseline.txt"), "original\n");
  git("add", "--", "baseline.txt");
  git("commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD");
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), "new file\n");
  git("add", "--", path);
  git("commit", "-qm", "change");
  if (includeDocsCommit) {
    mkdirSync(join(cwd, "docs"), { recursive: true });
    writeFileSync(join(cwd, "docs", "change.md"), "docs\n");
    git("add", "--", "docs/change.md");
    git("commit", "-qm", "docs follow-up");
  }
  const run = (env = {}) => spawnSync("bash", [script], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, VERCEL_GIT_PREVIOUS_SHA: base, VERCEL_GIT_COMMIT_REF: "master", ...env },
  });
  return { git, base, run };
}

test("root documentation may skip deployment", (t) => {
  for (const path of ["README.md", "SECURITY.md"]) {
    const { run } = fixture(t, path);
    const result = run();
    assert.equal(result.status, 0, `${path}: ${result.stderr} ${result.stdout}`);
  }
});

test("nested docs and unit tests may skip deployment", (t) => {
  for (const path of ["docs/ops/note.md", "unit-tests/fixture.md"]) {
    const { run } = fixture(t, path);
    assert.equal(run().status, 0, path);
  }
});

test("public Markdown cannot silently skip a Vercel build", (t) => {
  for (const path of ["public/README.md", "public/legal/letter.md"]) {
    const { run } = fixture(t, path);
    const result = run();
    assert.equal(result.status, 1, `${path}: ${result.stderr} ${result.stdout}`);
    assert.match(result.stdout, /Deploy-relevant change detected/);
  }
});

test("nested application markdown remains deploy-relevant", (t) => {
  const { run } = fixture(t, "app/content/page.md");
  assert.equal(run().status, 1);
});

test("mixed runtime plus documentation commits still build", (t) => {
  const { run } = fixture(t, "public/legacy.md", { includeDocsCommit: true });
  assert.equal(run().status, 1);
});

test("filenames containing spaces or newline cannot evade build", (t) => {
  for (const path of ["public/family note.md", "public/family\nnote.md"]) {
    const { run } = fixture(t, path);
    assert.equal(run().status, 1, path);
  }
});

test("unrelated or future deployment SHA must build", (t) => {
  const { run, git } = fixture(t, "docs/change.md");
  // HEAD is valid but cannot be a previous deployed commit for a different branch.
  const result = run({ VERCEL_GIT_PREVIOUS_SHA: git("hash-object", "baseline.txt") });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /No verified previous deployment SHA/);
});

test("unknown previous deployment base fails open to build", (t) => {
  const { run } = fixture(t, "docs/change.md");
  const result = run({ VERCEL_GIT_PREVIOUS_SHA: "" });
  assert.equal(result.status, 1);
});

test("preview checkpoint always builds", (t) => {
  const { run } = fixture(t, "docs/change.md");
  const result = run({ VERCEL_GIT_COMMIT_REF: "vercel-preview-pr-123" });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Validated checkpoint/);
});

test("a valid unrelated previous commit must never skip a build", (t) => {
  const { run, git } = fixture(t, "docs/change.md");
  const orphanCommit = git("commit-tree", "HEAD^{tree}", "-m", "unrelated");
  const result = run({ VERCEL_GIT_PREVIOUS_SHA: orphanCommit });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /not an ancestor/);
});
