import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("Dagger spike is pinned, local-first and does not expose private workspaces", async () => {
  const [script, workflow, justfile] = await Promise.all([
    read("scripts/dagger-ci.sh"),
    read(".github/workflows/dagger-spike.yml"),
    read("justfile"),
  ]);

  assert.match(script, /DAGGER_REQUIRED_VERSION="v0\.21\.10"/);
  assert.match(script, /node:26\.8\.2-bookworm@sha256:/);
  assert.match(script, /npm@11\.17\.0/);
  assert.match(script, /\.private-publication-source\/\*\*/);
  assert.match(script, /\.redaction-work\/\*\*/);
  assert.match(script, /\.env\.secrets/);
  assert.match(script, /\.env\.local/);
  assert.doesNotMatch(script, /\/var\/run\/docker\.sock|--privileged/);

  assert.match(
    script,
    /QUALITY_BASE_REF=HEAD bash scripts\/agent-p0-check\.sh/,
  );
  assert.match(
    script,
    /QUALITY_BASE_REF=HEAD bash scripts\/agent-quality-gate\.sh --preflight/,
  );
  assert.match(script, /npm run test:unit/);
  assert.match(script, /npm run build/);
  assert.doesNotMatch(script, /scripts\/agent-quality-gate\.sh --fix/);

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /workflow_call:/);
  assert.match(
    workflow,
    /dagger\/dagger-for-github@27b130bf0f79a7f6fbbbe0fbca6760dc9bb40a77/,
  );
  assert.match(workflow, /version: v0\.21\.10/);
  assert.match(workflow, /bash scripts\/dagger-ci\.sh/);
  assert.doesNotMatch(workflow, /pull_request:|push:/);

  for (const target of [
    "dagger-p0",
    "dagger-quality-preflight",
    "dagger-test",
    "dagger-build",
  ]) {
    assert.ok(justfile.includes(target), target);
  }
});

test("Dagger portability keeps shell formatting Docker-free", async () => {
  const preCommit = await readFile(
    new URL("../.pre-commit-config.yaml", import.meta.url),
    "utf8",
  );

  assert.match(preCommit, /- {3}id: shfmt\n/);
  assert.doesNotMatch(preCommit, /shfmt-docker/);
});

test("Dagger rejects unknown targets without a runtime or network dependency", () => {
  const script = new URL("../scripts/dagger-ci.sh", import.meta.url);
  const invalid = spawnSync("bash", [script.pathname, "unsupported"], {
    encoding: "utf8",
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /unknown Dagger target: unsupported\nUsage:/);
  assert.doesNotMatch(invalid.stderr, /dagger is required/);

  const help = spawnSync("bash", [script.pathname, "--help"], {
    encoding: "utf8",
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Dagger spike/);

  const unexpectedHelpArgs = spawnSync("bash", [script.pathname, "--help", "build"], {
    encoding: "utf8",
    env: { ...process.env, PATH: "/usr/bin:/bin" },
  });
  assert.equal(unexpectedHelpArgs.status, 2);
  assert.match(unexpectedHelpArgs.stderr, /Usage:/);
  assert.doesNotMatch(unexpectedHelpArgs.stderr, /dagger is required/);
});
