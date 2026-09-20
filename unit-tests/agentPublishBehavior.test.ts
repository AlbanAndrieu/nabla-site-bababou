import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const publisherPath = fileURLToPath(
  new URL("../scripts/agent-publish.sh", import.meta.url),
);
const supportPath = fileURLToPath(
  new URL("../scripts/lib/agent-quality-support.sh", import.meta.url),
);

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), "bababou-agent-publish-"));
  await mkdir(join(directory, "scripts", "lib"), { recursive: true });
  await mkdir(join(directory, "node_modules"), { recursive: true });
  await mkdir(join(directory, "bin"), { recursive: true });

  await writeFile(
    join(directory, "scripts", "agent-publish.sh"),
    await readFile(publisherPath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "lib", "agent-quality-support.sh"),
    await readFile(supportPath, "utf8"),
  );
  await writeFile(
    join(directory, "scripts", "agent-quality-gate.sh"),
    "#!/usr/bin/env bash\nset -euo pipefail\necho \"gate:$*\" >> \"$(git rev-parse --git-path agent-publish-test-calls)\"\n",
  );
  await writeFile(
    join(directory, "scripts", "ci-quality-scope.sh"),
    "#!/usr/bin/env bash\nset -euo pipefail\nprintf 'full_project=%s\\nsast=false\\ndependencies=false\\nchanged_count=1\\n' \"${FULL_SCOPE:-false}\"\n",
  );
  await writeFile(join(directory, "node_modules", ".package-lock.json"), "{}\n");

  const npm = join(directory, "bin", "npm");
  await writeFile(
    npm,
    [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      "if [[ \"${1:-}\" == \"--version\" ]]; then echo 11.17.0; exit 0; fi",
      "if [[ \"${1:-}\" == \"run\" ]]; then echo \"npm-run:${2:-}\" >> \"$(git rev-parse --git-path agent-publish-test-calls)\"; exit 0; fi",
      "echo \"unexpected npm invocation: $*\" >&2",
      "exit 2",
      "",
    ].join("\n"),
  );
  const preCommit = join(directory, "bin", "pre-commit");
  await writeFile(
    preCommit,
    "#!/usr/bin/env bash\nset -euo pipefail\nif [[ \"${1:-}\" == \"--version\" ]]; then echo 'pre-commit 4.6.2'; exit 0; fi\nexit 0\n",
  );

  for (const path of [
    join(directory, "scripts", "agent-publish.sh"),
    join(directory, "scripts", "agent-quality-gate.sh"),
    join(directory, "scripts", "ci-quality-scope.sh"),
    npm,
    preCommit,
  ]) {
    await chmod(path, 0o755);
  }

  git(directory, "init", "--quiet");
  git(directory, "config", "user.name", "Agent Publish Test");
  git(directory, "config", "user.email", "agent-publish@example.invalid");
  await writeFile(join(directory, "fixture.txt"), "base\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  await writeFile(join(directory, "fixture.txt"), "base\nhead\n");
  git(directory, "add", "fixture.txt");
  git(directory, "commit", "--quiet", "-m", "head");

  const callLog = join(directory, ".git", "agent-publish-test-calls");
  await writeFile(callLog, "");
  return { directory, baseSha, callLog };
}

function publish(directory, baseSha, fullScope = false) {
  return spawnSync("bash", ["scripts/agent-publish.sh"], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${join(directory, "bin")}:${process.env.PATH ?? ""}`,
      QUALITY_BASE_REF: baseSha,
      FULL_SCOPE: fullScope ? "true" : "false",
    },
  });
}

test("maintenance publication writes and reuses an exact proof without building", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  const first = publish(fixture.directory, fixture.baseSha);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /maintenance-only publication scope/);
  assert.match(first.stdout, /QG_PUBLISH_PROOF_WRITTEN/);

  const firstCalls = await readFile(fixture.callLog, "utf8");
  assert.match(firstCalls, /gate:--publish/);
  assert.doesNotMatch(firstCalls, /npm-run:build|npm-run:privacy:check:build/);

  const second = publish(fixture.directory, fixture.baseSha);
  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /QG_PUBLISH_PROOF_REUSED/);
  assert.equal(
    await readFile(fixture.callLog, "utf8"),
    firstCalls,
    "proof reuse must not rerun gate or build",
  );
});

test("deploy-relevant publication runs build and built-output privacy checks", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));

  const result = publish(fixture.directory, fixture.baseSha, true);
  assert.equal(result.status, 0, result.stderr);
  const calls = await readFile(fixture.callLog, "utf8");
  assert.match(calls, /gate:--publish/);
  assert.match(calls, /npm-run:build/);
  assert.match(calls, /npm-run:privacy:check:build/);
  assert.match(result.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
});

test("publication refuses a dirty committed batch", async (t) => {
  const fixture = await createFixture();
  t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
  await writeFile(join(fixture.directory, "fixture.txt"), "dirty\n");

  const result = publish(fixture.directory, fixture.baseSha);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /QG_PUBLISH_DIRTY/);
});
