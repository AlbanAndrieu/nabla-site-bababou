import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("agent gate delegates shared mechanics and keeps Bababou pre-build checks", async () => {
  const gateUrl = new URL("../scripts/agent-quality-gate.sh", import.meta.url);
  const supportUrl = new URL(
    "../scripts/lib/agent-quality-support.sh",
    import.meta.url,
  );
  const [gate, support, gateInfo, supportInfo] = await Promise.all([
    read("../scripts/agent-quality-gate.sh"),
    read("../scripts/lib/agent-quality-support.sh"),
    stat(gateUrl),
    stat(supportUrl),
  ]);

  assert.notEqual(gateInfo.mode & 0o100, 0);
  assert.equal(
    supportInfo.mode & 0o100,
    0,
    "sourced support library must not be executable",
  );
  assert.match(gate, /source scripts\/lib\/agent-quality-support\.sh/);
  for (const token of [
    "QG_BASE_MISSING",
    "QG_BASE_STALE",
    "QG_LARGE_DELETION",
    "QG_EXEC_BIT",
    "git diff --check",
    "bash -n",
    "changed shell syntax",
    "changed Python syntax",
    "baseline-aware code-size report",
    "QG_DIRTY_TREE",
    "--preflight",
    "--fix",
    "--publish",
    "npm run lint",
    "npm run lint:css",
    "npx next typegen",
    "npm run typecheck",
    "npm run test:unit",
    "npm run privacy:check",
    "bash scripts/quality-gate.sh",
  ]) {
    assert.ok(gate.includes(token), `missing agent gate contract: ${token}`);
  }
  for (const helper of [
    "resolve_base_ref",
    "require_supported_js_toolchain",
    "run_compact",
    "run_compact_report",
    "collect_changed_files",
    "collect_deleted_files",
    "workspace_fingerprint",
    "classify_changed_files",
  ]) {
    assert.match(support, new RegExp(`${helper}\\(\\)`));
  }
  assert.match(gate, /require_supported_js_toolchain QG_AGENT/);
  assert.doesNotMatch(gate, /agent-publication-proof|QG_PUBLISH_PROOF_REUSED/);
});

test("publisher owns exact proof reuse and scope-aware production build", async () => {
  const url = new URL("../scripts/agent-publish.sh", import.meta.url);
  const [publish, info] = await Promise.all([
    read("../scripts/agent-publish.sh"),
    stat(url),
  ]);

  assert.notEqual(info.mode & 0o100, 0);
  assert.match(publish, /source scripts\/lib\/agent-quality-support\.sh/);
  assert.match(publish, /require_supported_js_toolchain QG_PUBLISH/);
  assert.match(publish, /QG_PUBLISH_DIRTY/);
  assert.match(publish, /QG_PUBLISH_BASE_STALE/);
  assert.match(publish, /QG_PUBLISH_PROTECTED_BRANCH/);
  assert.match(publish, /QG_PUBLISH_DETACHED_HEAD/);
  assert.match(publish, /QG_PUBLISH_PROOF_OK/);
  assert.match(publish, /--status/);
  assert.match(publish, /git rev-parse --git-path agent-publication-proof/);
  assert.match(publish, /QG_PUBLISH_PROOF_REUSED/);
  assert.match(publish, /QUALITY_FORCE_PUBLISH/);
  assert.match(publish, /agent-quality-gate\.sh --publish/);
  assert.match(publish, /bash scripts\/ci-scope\.sh "\$\{BASE_SHA\}" HEAD/);
  assert.match(publish, /Next\.js production build/);
  assert.match(publish, /npm run privacy:check:build/);
  assert.match(
    publish,
    /non-build publication scope; Next build intentionally skipped/,
  );
  assert.match(publish, /QG_PUBLISH_PROOF_WRITTEN/);
});

test("P0, strict gate and publisher enforce the repository Node/npm engines", async () => {
  const [p0, gate, publish, support, packageSource] = await Promise.all([
    read("../scripts/agent-p0-check.sh"),
    read("../scripts/agent-quality-gate.sh"),
    read("../scripts/agent-publish.sh"),
    read("../scripts/lib/agent-quality-support.sh"),
    read("../package.json"),
  ]);
  const pkg = JSON.parse(packageSource) as {
    engines?: { node?: string; npm?: string };
  };

  assert.equal(pkg.engines?.node, ">=24.11.0 <27");
  assert.equal(pkg.engines?.npm, ">=11.17.0 <12");
  assert.match(p0, /require_supported_js_toolchain QG_P0/);
  assert.match(gate, /require_supported_js_toolchain QG_AGENT/);
  assert.match(publish, /require_supported_js_toolchain QG_PUBLISH/);
  assert.match(support, /Node %s is outside repository engines >=24\.11\.0 <27/);
  assert.match(support, /npm %s is outside repository engines >=11\.17\.0 <12/);
});

test("npm, mise and pre-push expose the separated publication workflow", async () => {
  const [packageSource, mise, prePush] = await Promise.all([
    read("../package.json"),
    read("../mise.toml"),
    read("../.pre-commit-pre-push.yaml"),
  ]);
  const pkg = JSON.parse(packageSource) as { scripts: Record<string, string> };

  assert.equal(pkg.scripts["quality:gate"], "bash scripts/quality-gate.sh");
  assert.equal(pkg.scripts["agent:fix"], "bash scripts/agent-quality-gate.sh --fix");
  assert.equal(pkg.scripts["agent:quality"], "bash scripts/agent-quality-gate.sh");
  assert.equal(pkg.scripts["agent:publish"], "bash scripts/agent-publish.sh");
  assert.equal(pkg.scripts["quality:agent:publish"], "bash scripts/agent-publish.sh");

  for (const task of [
    "[tasks.agent-fix]",
    "[tasks.agent-quality]",
    "[tasks.agent-publish]",
  ]) {
    assert.match(mise, new RegExp(task.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }
  assert.match(mise, /run = "bash scripts\/agent-publish\.sh"/);
  assert.match(prePush, /entry: bash scripts\/agent-publish\.sh/);
});

test("fix mode converges pre-commit before and after npm auto-fixes", async () => {
  const [gate, support] = await Promise.all([
    read("../scripts/agent-quality-gate.sh"),
    read("../scripts/lib/agent-quality-support.sh"),
  ]);

  assert.match(gate, /QUALITY_FIX_PASSES:-12/);
  assert.match(gate, /for \(\(pass = 1; pass <= FIX_PASSES; pass\+\+\)\)/);
  assert.match(gate, /precommit_fix_until_stable/);
  assert.match(gate, /npm run lint:fix/);
  assert.match(gate, /npm run lint:css:fix/);
  assert.match(gate, /QG_FIX_DID_NOT_CONVERGE/);
  assert.match(gate, /QG_PRECOMMIT_FAILED/);
  assert.match(support, /AGENT_GATE_SHELL_FILES/);
  assert.match(support, /scripts\/agent-publish\.sh/);
});

test("CI rejects deterministic formatter failures before network SAST and npm bootstrap", async () => {
  const ci = await read("../.github/workflows/ci.yml");
  const canonical = ci.indexOf(
    "Run canonical changed-file quality gate before network/SAST/npm bootstrap",
  );
  const canonicalEnforce = ci.indexOf(
    "Enforce canonical changed-file quality gate",
  );
  const baseline = ci.indexOf(
    "Verify current production baseline before PR build",
  );
  const semgrep = ci.indexOf("Run Semgrep SAST on changed source");
  const setupNode = ci.indexOf("Setup Node.js");
  const install = ci.indexOf("Install dependencies");

  assert.ok(canonical >= 0);
  assert.ok(canonicalEnforce > canonical);
  assert.ok(baseline > canonicalEnforce);
  assert.ok(semgrep > baseline);
  assert.ok(setupNode > semgrep);
  assert.ok(install > setupNode);
  assert.match(ci, /pre-commit==4\.6\.2/);
  assert.match(ci, /QUALITY_LOG_TAIL: "12"/);
  assert.match(ci, /steps\.canonical-quality-gate\.outcome != 'success'/);
});

test("draft PRs still stop after dependency-free Git preflight", async () => {
  const workflow = await read("../.github/workflows/ci.yml");

  assert.match(workflow, /types: \[opened, synchronize, reopened, ready_for_review\]/);
  assert.match(workflow, /Run agent preflight before dependency install/);
  assert.match(workflow, /Draft PR preflight/);
  assert.match(workflow, /github\.event\.pull_request\.draft == true/);
  assert.match(workflow, /bash scripts\/agent-quality-gate\.sh --preflight/);
});

test("Copilot bootstrap follows all agent quality inputs", async () => {
  const setup = await read("../.github/workflows/copilot-setup-steps.yml");

  for (const input of [
    ".nvmrc",
    ".python-version",
    ".pre-commit-config.yaml",
    ".pre-commit-pre-push.yaml",
    "mise.toml",
    "package.json",
    "package-lock.json",
    "scripts/agent-quality-gate.sh",
    "scripts/agent-p0-check.sh",
    "scripts/agent-publish.sh",
    "scripts/lib/agent-quality-support.sh",
  ]) {
    assert.ok(
      setup.includes("- " + input),
      `Copilot bootstrap trigger must include ${input}`,
    );
  }
});

test("critical quality and Preview scripts remain executable", async () => {
  const scripts = [
    "scripts/quality-gate.sh",
    "scripts/agent-quality-gate.sh",
    "scripts/agent-p0-check.sh",
    "scripts/agent-publish.sh",
    "scripts/ci-scope.sh",
    "scripts/verify-production-baseline.sh",
    "scripts/verify-production-live.sh",
    "scripts/ci-performance-budget.sh",
    "scripts/publish-vercel-preview-checkpoint.sh",
  ] as const;

  const stats = await Promise.all(
    scripts.map((path) => stat(new URL(`../${path}`, import.meta.url))),
  );

  for (const [index, fileStat] of stats.entries()) {
    assert.notEqual(
      fileStat.mode & 0o100,
      0,
      `${scripts[index]} must remain executable`,
    );
  }
});
