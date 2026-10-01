import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test(
  "CI scope separates security, build and Preview with Bababou dependency scope",
  async () => {
    const url = new URL("../scripts/ci-scope.sh", import.meta.url);
    const [source, info] = await Promise.all([
      read("../scripts/ci-scope.sh"),
      stat(url),
    ]);

    assert.notEqual(info.mode & 0o100, 0);
    assert.match(source, /--diff-filter=ACMRD/);
    assert.match(source, /is_source_file/);
    assert.match(source, /is_maintenance_only_path/);
    assert.match(source, /is_preview_safe_path/);
    assert.match(source, /CHANGED_FILES\[@\].*== 0/);
    assert.match(source, /maintenance_only=false/);
    assert.match(source, /preview_required=true/);
    assert.match(source, /dependencies=true/);
    assert.match(source, /if ! is_maintenance_only_path/);
    assert.match(source, /if ! is_preview_safe_path/);
    assert.match(source, /application=true/);
    assert.match(source, /build=true/);
    assert.match(source, /sast=true/);
    assert.match(source, /zap_bootstrap=true/);
    assert.match(source, /BASE_REF="\$\{1:-\$\(resolve_base_ref\)\}"/);
    assert.match(source, /HEAD_REF="\$\{2:-HEAD\}"/);
  },
);

test("known quality orchestration files stay maintenance-only", async () => {
  const source = await read("../scripts/ci-scope.sh");

  for (const path of [
    "scripts/agent-quality-gate.sh",
    "scripts/agent-p0-check.sh",
    "scripts/agent-publish.sh",
    "scripts/lib/agent-quality-support.sh",
    "scripts/quality-gate.sh",
    "scripts/ci-scope.sh",
    "scripts/verify-production-baseline.sh",
    "scripts/verify-production-live.sh",
    "scripts/ci-performance-budget.sh",
    "scripts/publish-vercel-preview-checkpoint.sh",
  ]) {
    assert.ok(source.includes(path), `${path} must stay maintenance-only`);
  }
  const maintenanceStart = source.indexOf("is_maintenance_only_path() {");
  const previewStart = source.indexOf("is_preview_safe_path() {");
  assert.ok(maintenanceStart >= 0 && previewStart > maintenanceStart);
  assert.doesNotMatch(source.slice(maintenanceStart, previewStart), /\.github\/\*/);
  assert.match(source.slice(previewStart), /\.github\/\*/);
});

test("maintenance CI avoids Semgrep, Next build and dependency scanning", async () => {
  const workflow = await read("../.github/workflows/ci.yml");

  assert.match(workflow, /- name: Classify CI change scope/);
  assert.match(workflow, /id: ci-scope/);
  assert.match(
    workflow,
    /bash scripts\/ci-scope\.sh "\$\{BASE_SHA\}" "\$\{HEAD_SHA\}"/,
  );
  assert.match(workflow, /steps\.ci-scope\.outputs\.sast == 'true'/);
  assert.match(workflow, /steps\.ci-scope\.outputs\.build == 'true'/);
  assert.match(workflow, /steps\.ci-scope\.outputs\.build != 'true'/);
  assert.match(workflow, /steps\.ci-scope\.outputs\.dependencies == 'true'/);
  assert.match(workflow, /steps\.ci-scope\.outputs\.application/);
  assert.doesNotMatch(workflow, /outputs\.full_project/);
  assert.match(workflow, /- name: Run maintenance project checks/);
  assert.match(workflow, /npm run lint\n\s+npm run lint:css\n\s+npm run test:unit/);
  assert.match(
    workflow,
    /grep -E '[^\n]*\\\.github\/workflows\/.*\\\.ya\?ml/,
  );
  assert.match(
    workflow,
    /preview_required:\s*\$\{\{ steps\.ci-scope\.outputs\.preview_required \}\}/,
  );
});

test("draft Semgrep enforcement cannot fail a skipped scan", async () => {
  const workflow = await read("../.github/workflows/ci.yml");
  const enforceStart = workflow.indexOf("- name: Enforce Semgrep SAST");
  const setupNode = workflow.indexOf("- name: Setup Node.js", enforceStart);
  const block = workflow.slice(enforceStart, setupNode);

  assert.ok(enforceStart >= 0);
  assert.match(block, /github\.event\.pull_request\.draft == false/);
  assert.match(block, /steps\.ci-scope\.outputs\.sast == 'true'/);
  assert.match(block, /steps\.semgrep-sast\.outcome != 'success'/);
});

test("production baseline and live smoke run before dependency installation", async () => {
  const [
    workflow,
    baseline,
    baselineClassification,
    live,
    baselineInfo,
    liveInfo,
  ] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/verify-production-baseline.sh"),
    read("../scripts/lib/production-baseline-classification.sh"),
    read("../scripts/verify-production-live.sh"),
    stat(new URL("../scripts/verify-production-baseline.sh", import.meta.url)),
    stat(new URL("../scripts/verify-production-live.sh", import.meta.url)),
  ]);

  assert.notEqual(baselineInfo.mode & 0o100, 0);
  assert.notEqual(liveInfo.mode & 0o100, 0);
  const preflight = workflow.indexOf("- name: Run agent preflight before dependency install");
  const canonicalGate = workflow.indexOf(
    "- name: Run canonical changed-file quality gate before network/SAST/npm bootstrap",
  );
  const baselineGate = workflow.indexOf("- name: Verify current production baseline before PR build");
  const liveGate = workflow.indexOf("- name: Revalidate canonical production smoke before PR build");
  const setupNode = workflow.indexOf("- name: Setup Node.js");
  assert.ok(
    preflight >= 0 &&
      canonicalGate > preflight &&
      baselineGate > canonicalGate &&
      liveGate > baselineGate &&
      setupNode > liveGate,
  );
  assert.match(workflow, /statuses:\s*read/);
  assert.match(
    workflow,
    /BASE_SHA: \\${{ steps\\.current-heads\\.outputs\\.production-sha }}/,
  );
  assert.doesNotMatch(workflow, /github\\.event\\.pull_request\\.base\\.sha/);
  assert.match(workflow, /bash scripts\/verify-production-baseline\\.sh/);
  assert.match(
    baseline,
    /source "\$\{SCRIPT_DIR\}\/lib\/production-baseline-classification\\.sh"/,
  );
  assert.match(
    workflow,
    /VERCEL_AUTOMATION_BYPASS_SECRET: \$\{\{ secrets\\.VERCEL_AUTOMATION_BYPASS_SECRET \}\}/,
  );
  assert.match(workflow, /bash scripts\/verify-production-live\\.sh/);

  for (const context of ["Vercel", "Production Post-deploy Smoke", "Production DAST"]) {
    assert.ok(baseline.includes('"' + context + '"'));
  }
  assert.match(baseline, /vercel_state/);
  assert.match(baseline, /production-only statuses are absent on metadata-only release/);
  assert.match(baselineClassification, /chore\\\(release\\\):/);
  assert.match(baselineClassification, /\[skip ci\]/);
  assert.match(baselineClassification, /package\\.json changed beyond version metadata/);
  assert.match(
    baselineClassification,
    /package-lock\\.json changed beyond root version metadata/,
  );
  assert.match(
    baselineClassification,
    /parent .* has inconsistent package\/lock versions/,
  );
  assert.match(
    baselineClassification,
    /release .* has inconsistent package\/lock versions/,
  );
  assert.match(
    baselineClassification,
    /release subject does not match package version/,
  );
  assert.match(baselineClassification, /PROD_BASE_RELEASE_VERSION/);
  assert.match(baselineClassification, /PROD_BASE_RELEASE_GRAPH/);
  assert.match(
    baselineClassification,
    /baseline inheritance requires a linear single-parent release commit/,
  );
  assert.match(
    baselineClassification,
    /production release hop must use stable numeric SemVer/,
  );
  assert.match(
    baselineClassification,
    /does not monotonically advance package version/,
  );
  assert.match(baseline, /PROD_BASE_UNHEALTHY/);
  assert.match(baselineClassification, /PROD_BASE_RELEASE_SCOPE/);

  for (const path of ["/", "/index.html", "/test", "/contact", "/policy"]) {
    assert.ok(live.includes('probe "' + path + '"'));
  }
  assert.match(live, /PROD_LIVE_CHECKPOINT/);
  assert.match(live, /x-vercel-mitigated/);
  assert.match(live, /vercel\\\.com\/\(login\|sso-api\)/);
  assert.match(live, /--connect-timeout 5/);
  assert.match(live, /--max-time 15/);
});

test("CI performance budgets are warning-only and derived from observed headroom", async () => {
  const [workflow, budget, info] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/ci-performance-budget.sh"),
    stat(new URL("../scripts/ci-performance-budget.sh", import.meta.url)),
  ]);

  assert.notEqual(info.mode & 0o100, 0);
  assert.match(workflow, /- name: Check CI performance warning budgets/);
  assert.match(workflow, /bash scripts\/ci-performance-budget\.sh/);
  assert.match(budget, /NPM_CI_WARN_SECONDS=.*30/);
  assert.match(budget, /NODE_MODULES_WARN_MB=.*800/);
  assert.match(budget, /FULL_CHECK_WARN_SECONDS=.*60/);
  assert.match(budget, /NEXT_BUILD_WARN_SECONDS=.*30/);
  assert.match(budget, /NEXT_OUTPUT_WARN_MB=.*80/);
  assert.match(budget, /::warning::CI performance regression candidate/);
  assert.match(budget, /quality result remains non-blocking/);
  assert.doesNotMatch(budget, /exit 1/);
});

test("CI performance emits a toolchain-aware exact-checkout baseline record without artifacts", async () => {
  const [workflow, budget] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/ci-performance-budget.sh"),
  ]);

  assert.match(budget, /CI_PERF_BASELINE schema=2 run=/);
  assert.doesNotMatch(budget, /CI_PERF_BASELINE schema=1 run=/);
  assert.match(budget, /GITHUB_RUN_ID/);
  assert.match(budget, /GITHUB_RUN_NUMBER/);
  assert.match(budget, /GITHUB_RUN_ATTEMPT/);
  assert.match(budget, /GITHUB_HEAD_REF/);
  assert.match(budget, /GITHUB_REF_NAME/);
  assert.match(budget, /RUNNER_OS/);
  assert.match(budget, /RUNNER_ARCH/);
  assert.match(budget, /node --version/);
  assert.match(budget, /npm --version/);
  assert.match(budget, /git rev-parse HEAD/);
  assert.doesNotMatch(budget, /sha=\$\(value_or_na "\$\{GITHUB_SHA/);
  assert.match(budget, /GITHUB_EVENT_NAME/);
  assert.match(budget, /scope=\$\{quality_scope\}/);
  for (const field of ["run_number=", "ref=", "node=", "npm="]) {
    assert.ok(budget.includes(field));
  }
  for (const metric of [
    "npm_ci_s=",
    "node_modules_mb=",
    "full_checks_s=",
    "next_build_s=",
    "next_output_mb=",
  ]) {
    assert.ok(budget.includes(metric));
  }
  assert.match(budget, /Copy-ready baseline record/);
  assert.doesNotMatch(workflow, /ci-performance.*upload-artifact/is);
});

test("explicit npm cache owners disable setup-node automatic npm caching", async () => {
  const [ci, copilot, playwright] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../.github/workflows/copilot-setup-steps.yml"),
    read("../.github/workflows/playwright.yml"),
  ]);

  for (const [name, workflow] of [
    ["Quality", ci],
    ["Copilot Setup", copilot],
    ["Playwright", playwright],
  ] as const) {
    assert.match(workflow, /package-manager-cache:\s*false/, `${name} must disable setup-node npm cache`);
    assert.match(workflow, /path:\s*~\/\.npm/, `${name} must retain explicit npm cache ownership`);
  }
});

test("pre-commit keeps one authority per Ruff, CSS and shell formatting concern", async () => {
  const [preCommit, mise, packageRaw] = await Promise.all([
    read("../.pre-commit-config.yaml"),
    read("../mise.toml"),
    read("../package.json"),
  ]);
  const pkg = JSON.parse(packageRaw) as {
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  assert.match(preCommit, /^fail_fast: false/m);
  assert.doesNotMatch(preCommit, /pre-commit-update/);
  assert.match(preCommit, /repo: https:\/\/github\.com\/pre-commit\/pre-commit\.git[\s\S]*?rev: v4\.6\.2/);
  assert.match(preCommit, /id: ruff-format/);
  assert.match(preCommit, /id: ruff-check/);
  assert.match(preCommit, /args: \[--fix, --unsafe-fixes\]/);
  assert.doesNotMatch(preCommit, /id: ruff\n/);
  assert.doesNotMatch(preCommit, /pre-commit-stylelint|id: stylelint|stylelint@/);
  assert.match(preCommit, /id: shfmt-docker[\s\S]*?args: \["-i", "4", "-ci"\]/);
  assert.match(preCommit, /id: bashate[\s\S]*?args: \[-i, "E002,E003,E006"\]/);
  assert.equal(pkg.devDependencies?.stylelint, "^17.14.1");
  assert.match(pkg.scripts?.["lint:css"] ?? "", /^stylelint /);
  assert.doesNotMatch(mise, /--hook-type commit-msg/);
  assert.match(mise, /\[tasks\.hooks-update\]/);
  assert.match(mise, /pre-commit autoupdate/);
});

test("Copilot setup stays available but does not spend installs on draft synchronization", async () => {
  const setup = await read("../.github/workflows/copilot-setup-steps.yml");

  assert.match(setup, /workflow_dispatch:/);
  assert.match(setup, /types: \[opened, synchronize, reopened, ready_for_review\]/);
  assert.match(setup, /group: copilot-setup-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/);
  assert.match(setup, /cancel-in-progress: true/);
  assert.match(
    setup,
    /if: github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false/,
  );
  assert.match(setup, /timeout-minutes: 15/);
});

test("retired asset metadata stays maintenance-only and absent", async () => {
  const [workflow, scope] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/ci-scope.sh"),
  ]);

  assert.equal((workflow.match(/- "\.assetsignore"/g) ?? []).length, 2);
  assert.match(scope, /\.assetsignore/);
  await assert.rejects(stat(new URL("../.assetsignore", import.meta.url)), /ENOENT/);
});

test("quality-only files do not trigger an application Preview checkpoint", async () => {
  const [scope, workflow] = await Promise.all([
    read("../scripts/ci-scope.sh"),
    read("../.github/workflows/ci.yml"),
  ]);

  for (const path of [
    ".assetsignore",
    ".pre-commit-config.yaml",
    ".pre-commit-pre-push.yaml",
    "mise.toml",
    "scripts/agent-quality-gate.sh",
    "scripts/agent-p0-check.sh",
    "scripts/agent-publish.sh",
    "scripts/lib/agent-quality-support.sh",
    "scripts/ci-scope.sh",
    "scripts/verify-production-baseline.sh",
    "scripts/verify-production-live.sh",
    "scripts/ci-performance-budget.sh",
    "scripts/quality-gate.sh",
    "scripts/publish-vercel-preview-checkpoint.sh",
  ]) {
    assert.ok(scope.includes(path), `${path} missing from canonical CI scope`);
  }

  assert.match(workflow, /needs\.quality\.outputs\.preview_required == 'true'/);
  assert.doesNotMatch(workflow, /const safeOnly/);
  assert.doesNotMatch(workflow, /deployRelevant/);
});
