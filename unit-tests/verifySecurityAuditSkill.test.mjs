import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  gitBlobId,
  UPSTREAM_BLOBS,
  verifySnapshot,
} from "../scripts/verify-security-audit-skill.mjs";

test("Git blob includes length/header", () => {
  assert.equal(
    gitBlobId(Buffer.from("test\n")),
    "9daeafb9864cf43055ae93beb0afd6c7d144bfa4",
  );
});
test("matches, detects tampering and missing files", () => {
  const root = mkdtempSync(join(tmpdir(), "audit-skill-"));
  try {
    mkdirSync(join(root, "skills", "security-audit"), { recursive: true });
    writeFileSync(join(root, "LICENSE"), "fixture\n");
    const manifest = {
      LICENSE: gitBlobId(Buffer.from("fixture\n")),
      "skills/security-audit/SKILL.md": gitBlobId(Buffer.from("correct")),
      "skills/security-audit/validate-findings.cjs":
        "0000000000000000000000000000000000000000",
    };
    writeFileSync(join(root, "skills/security-audit/SKILL.md"), "tampered");
    const results = verifySnapshot(root, manifest);
    assert.deepEqual(
      results.map((item) => item.ok),
      [true, false, false],
    );
    assert.equal(results[2].reason, "ENOENT");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("rejects unsafe manifest paths", () => {
  assert.throws(
    () => verifySnapshot("/tmp", { "../secret": "abc" }),
    /Unsafe manifest path/,
  );
});
test("pins every file from the verified upstream Git tree", () => {
  assert.equal(Object.keys(UPSTREAM_BLOBS).length, 22);
  assert.ok(UPSTREAM_BLOBS["skills/security-audit/report-schema.json"]);
  assert.ok(UPSTREAM_BLOBS["skills/security-audit/validate-findings.test.cjs"]);
});

test("refuses leaf and parent symlinks before reading content", () => {
  const root = mkdtempSync(join(tmpdir(), "audit-skill-link-"));
  const outside = mkdtempSync(join(tmpdir(), "audit-skill-outside-"));
  try {
    writeFileSync(join(outside, "secret"), "fixture-secret");
    symlinkSync(join(outside, "secret"), join(root, "LICENSE"));
    symlinkSync(outside, join(root, "external"));
    const id = gitBlobId(Buffer.from("fixture-secret"));
    const checks = verifySnapshot(root, {
      LICENSE: id,
      "external/secret": id,
    });
    assert.deepEqual(
      checks.map((result) => [result.ok, result.reason]),
      [
        [false, "SYMLINK"],
        [false, "SYMLINK"],
      ],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("rejects unexpected files when using the pinned upstream manifest", () => {
  const root = mkdtempSync(join(tmpdir(), "audit-extra-"));
  try {
    writeFileSync(join(root, "unlisted.js"), "untrusted");
    const results = verifySnapshot(root);
    assert.ok(
      results.some(
        (result) =>
          result.relativePath === "unlisted.js" &&
          result.reason === "UNEXPECTED_FILE" &&
          !result.ok,
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("allows only a real root .git metadata directory", () => {
  const root = mkdtempSync(join(tmpdir(), "audit-metadata-"));
  try {
    mkdirSync(join(root, ".git"));
    writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/main\\n");
    writeFileSync(join(root, "unauthorized.txt"), "extra");
    const result = verifySnapshot(root);
    assert.ok(
      result.some(
        (item) =>
          item.relativePath === "unauthorized.txt" &&
          item.reason === "UNEXPECTED_FILE",
      ),
    );
    assert.ok(!result.some((item) => item.relativePath.startsWith(".git/")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("allows a Git worktree .git pointer file but rejects other unexpected files", () => {
  const root = mkdtempSync(join(tmpdir(), "audit-worktree-"));
  try {
    writeFileSync(join(root, ".git"), "gitdir: ../.git/worktrees/skill\\n");
    writeFileSync(join(root, "unexpected.txt"), "untrusted");
    const results = verifySnapshot(root);
    assert.ok(!results.some((item) => item.relativePath === ".git"));
    assert.ok(
      results.some(
        (item) =>
          item.relativePath === "unexpected.txt" &&
          item.reason === "UNEXPECTED_FILE" &&
          !item.ok,
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("rejects a root .git symlink rather than treating it as metadata", () => {
  const root = mkdtempSync(join(tmpdir(), "audit-git-link-"));
  const outside = mkdtempSync(join(tmpdir(), "audit-git-target-"));
  try {
    symlinkSync(outside, join(root, ".git"));
    const checks = verifySnapshot(root);
    assert.ok(
      checks.some(
        (item) =>
          item.relativePath === ".git" &&
          item.reason === "SYMLINK" &&
          !item.ok,
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("rejects symlinked snapshot root", () => {
  const parent = mkdtempSync(join(tmpdir(), "audit-root-"));
  try {
    mkdirSync(join(parent, "real"));
    symlinkSync(join(parent, "real"), join(parent, "link"));
    assert.throws(
      () => verifySnapshot(join(parent, "link"), {}),
      /Snapshot root must be a real directory/,
    );
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});

test("rejects absolute and traversal paths", () => {
  assert.throws(
    () => verifySnapshot("/tmp", { "/etc/passwd": "abc" }),
    /Unsafe manifest path/,
  );
  assert.throws(
    () => verifySnapshot("/tmp", { "a/../b": "abc" }),
    /Unsafe manifest path/,
  );
});
