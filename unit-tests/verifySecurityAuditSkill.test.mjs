import assert from "node:assert/strict";
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
