import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("justfile delegates to canonical scripts while preserving Makefile", async () => {
  const [justfile, makefile, scope] = await Promise.all([
    read("justfile"),
    read("Makefile"),
    read("scripts/ci-scope.sh"),
  ]);
  assert.match(makefile, /^\.DEFAULT_GOAL = build/m);
  assert.match(justfile, /set shell := \["bash", "-euo", "pipefail", "-c"\]/);
  for (const command of [
    "mise run hooks",
    "bash scripts/agent-quality-gate.sh --preflight",
    "bash scripts/agent-p0-check.sh",
    "npm run quality:agent:fix",
    "npm run quality:agent",
    "bash scripts/agent-publish.sh --status",
  ]) {
    assert.ok(justfile.includes(command), command);
  }
  for (const command of [
    "betterleaks config check .betterleaks.toml",
    "betterleaks git --pre-commit --staged --redact --config .betterleaks.toml",
    "betterleaks git --pre-commit --redact --config .betterleaks.toml",
    "betterleaks git . --redact --config .betterleaks.toml",
  ]) {
    assert.ok(justfile.includes(command), command);
  }
  assert.doesNotMatch(justfile, /git push|git merge|rm -rf/);
  assert.equal(
    (scope.match(/Makefile \| justfile \| \.mega-linter\.yml \| \.betterleaks\.toml/g) ?? []).length,
    1,
  );
  assert.match(scope, /if is_maintenance_only_path "\$1"; then/);
});

test("Betterleaks stable v1 is the only executed secret scanner", async () => {
  const [precommit, mega, policy, readme, template] = await Promise.all([
    read(".pre-commit-config.yaml"),
    read(".mega-linter.yml"),
    read(".betterleaks.toml"),
    read("README.md"),
    read(".github/PULL_REQUEST_TEMPLATE.md"),
  ]);
  assert.match(
    precommit,
    /repo: https:\/\/github\.com\/betterleaks\/betterleaks\s+rev: v1\.9\.0/,
  );
  assert.match(precommit, /id: betterleaks(?:\s|$)/);
  assert.doesNotMatch(precommit, /id: betterleaks-docker/);
  assert.match(
    precommit,
    /betterleaks git --pre-commit --staged --redact --config \.betterleaks\.toml/,
  );
  assert.doesNotMatch(precommit, /ghcr\.io\/betterleaks\/betterleaks/);
  assert.doesNotMatch(precommit, /zricethezav\/gitleaks|id: gitleaks-docker/);
  assert.match(mega, /- REPOSITORY_GITLEAKS/);
  assert.doesNotMatch(
    mega,
    /REPOSITORY_GITLEAKS_ARGUMENTS|REPOSITORY_GITLEAKS_DISABLE_ERRORS/,
  );
  assert.match(policy, /betterleaksMinVersion\s*=\s*"v1\.9\.0"/);
  assert.match(policy, /minVersion\s*=\s*"v8\.25\.0"/);
  assert.match(policy, /useDefault\s*=\s*true/);
  assert.match(policy, /betterleaks:allow/);
  assert.doesNotMatch(policy, /allow:gitleaks/);
  assert.match(readme, /Betterleaks/);
  assert.match(template, /Betterleaks/);
});
