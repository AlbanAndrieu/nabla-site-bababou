import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const tool = fileURLToPath(
  new URL("../scripts/ci/release-tag-bridge.mjs", import.meta.url),
);

function scenario(t, options = {}) {
  const root = mkdtempSync(join(tmpdir(), "bababou-tag-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, "bin");
  mkdirSync(bin);
  const marker = join(root, "mutations.txt");
  const gh = join(bin, "gh");
  writeFileSync(
    gh,
    [
      "#!/usr/bin/env bash",
      'if [[ "$1" == release && "$2" == view ]]; then',
      '  [[ "${ALLOW_RELEASE:-0}" == 1 ]]',
      "  exit $?",
      "fi",
      'if [[ "$1" == api && "$2" == repos/*/git/ref/tags/* ]]; then',
      '  [[ -n "${REMOTE_REF_SHA:-}" ]] || exit 1',
      '  printf "%s\\n" "$REMOTE_REF_SHA"',
      '  exit 0',
      'fi',
      'printf "%s\\n" "$*" >> "$MUTATION_LOG"',
      '[[ "${FAIL_REMOTE_WRITE:-0}" != 1 ]]',
      "",
    ].join("\n"),
  );
  chmodSync(gh, 0o755);
  const git = (...args) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ version: "0.20.0" }),
  );
  git("add", ".");
  git("commit", "-qm", "baseline");
  if (options.legacy !== false) git("tag", "0.20.0");
  if (options.vtag) git("tag", options.vtag);
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ version: options.version ?? "0.21.0" }),
  );
  git("add", ".");
  git("commit", "-qm", "next change");
  const run = (arg = "--check", envOverride = {}) =>
    spawnSync(process.execPath, [tool, arg], {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: bin + ":" + (process.env.PATH ?? ""),
        GITHUB_REPOSITORY: "AlbanAndrieu/nabla-site-bababou",
        ALLOW_RELEASE: options.permitRelease === false ? "0" : "1",
        MUTATION_LOG: marker,
        FAIL_REMOTE_WRITE: options.failRemoteWrite ? "1" : "0",
        ...envOverride,
      },
    });
  return { marker, git, run };
}

test("a newer package version accepts an older valid v-tag", (t) => {
  const { run } = scenario(t, { vtag: "v0.20.0" });
  assert.equal(run().status, 0);
  assert.match(run().stdout, /RELEASE_TAG_OK existing=v0\.20\.0/);
});

test("legacy check is read-only and apply is idempotent", (t) => {
  const { run, git, marker } = scenario(t);
  const dry = run();
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /RELEASE_TAG_CHECK alias=v0\.20\.0/);
  assert.equal(git("tag", "--list", "v*"), "");
  assert.throws(() => readFileSync(marker, "utf8"));
  const apply = run("--apply");
  assert.equal(apply.status, 0, apply.stderr);
  assert.equal(git("tag", "--list", "v*"), "v0.20.0");
  assert.match(readFileSync(marker, "utf8"), /--method POST/);
  assert.equal(run("--apply").status, 0);
  assert.equal(readFileSync(marker, "utf8").trim().split("\n").length, 1);
});

test("fail closed on unverified releases, regressions and missing tags", (t) => {
  const noProof = scenario(t, { permitRelease: false });
  assert.equal(noProof.run("--apply").status, 1);
  assert.equal(noProof.git("tag", "--list", "v*"), "");
  const regression = scenario(t, { vtag: "v0.20.0", version: "0.19.0" });
  assert.equal(regression.run().status, 1);
  const missing = scenario(t, { legacy: false });
  assert.equal(missing.run().status, 1);
});

test("mixed tag histories reject newer numeric releases", (t) => {
  const mixed = scenario(t, { vtag: "v0.19.0" });
  assert.equal(mixed.run().status, 1);
  assert.match(mixed.run().stderr, /Numeric release is newer/);
  assert.equal(mixed.git("tag", "--list", "v*"), "v0.19.0");
});

test("semantic versions are sorted numerically, not lexicographically", (t) => {
  const { git, run } = scenario(t);
  git("tag", "-d", "0.20.0");
  git("tag", "0.9.0");
  git("tag", "0.10.0");
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /RELEASE_TAG_CHECK alias=v0\.10\.0/);
});

test("invalid package semver fails without creating a release tag", (t) => {
  const { git, run, marker } = scenario(t, {
    version: "0.21.0-beta.1",
  });
  const result = run("--apply");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /complete numeric semver/);
  assert.equal(git("tag", "--list", "v*"), "");
  assert.throws(() => readFileSync(marker, "utf8"));
});


test("failed remote publish leaves no local release alias", (t) => {
  const { run, git } = scenario(t, { failRemoteWrite: true });
  const result = run("--apply");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /RELEASE_TAG_BLOCKED/);
  assert.equal(git("tag", "--list", "v*"), "");
});

test("interrupted publish reuses only the verified remote commit", (t) => {
  const { run, marker, git } = scenario(t, { failRemoteWrite: true });
  const target = git("rev-parse", "0.20.0^{commit}");
  const result = run("--apply", { REMOTE_REF_SHA: target });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /RELEASE_TAG_REUSED alias=v0\.20\.0/);
  assert.equal(git("tag", "--list", "v*"), "v0.20.0");
  assert.equal(readFileSync(marker, "utf8").trim().split("\n").length, 1);
});

test("conflicting remote alias must not be overwritten", (t) => {
  const { run, git } = scenario(t, { failRemoteWrite: true });
  const otherSha = git("rev-parse", "HEAD");
  const result = run("--apply", { REMOTE_REF_SHA: otherSha });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not match/);
  assert.equal(git("tag", "--list", "v*"), "");
});

test("legacy tag outside validated Git history fails closed", (t) => {
  const { run, git } = scenario(t);
  const orphan = git("commit-tree", "HEAD^{tree}", "-m", "unrelated");
  git("tag", "-f", "0.20.0", orphan);
  const result = run("--apply");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not an ancestor/);
  assert.equal(git("tag", "--list", "v*"), "");
});

test("existing v-tag outside validated Git history fails closed", (t) => {
  const { run, git } = scenario(t, { vtag: "v0.20.0" });
  const orphan = git("commit-tree", "HEAD^{tree}", "-m", "unrelated");
  git("tag", "-f", "v0.20.0", orphan);
  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not an ancestor/);
});
