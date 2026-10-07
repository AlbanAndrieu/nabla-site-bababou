import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

function assertMatches(
  source: string,
  pattern: RegExp,
  label = pattern.toString(),
): void {
  assert.ok(pattern.test(source), `missing contract: ${label}`);
}

function assertNotMatches(
  source: string,
  pattern: RegExp,
  label = pattern.toString(),
): void {
  assert.ok(!pattern.test(source), `unexpected contract: ${label}`);
}

test("CI scope separates security, build and Preview with Bababou dependency scope", async () => {
  const url = new URL("../scripts/ci-scope.sh", import.meta.url);
  const [source, info] = await Promise.all([
    read("../scripts/ci-scope.sh"),
    stat(url),
  ]);

  assert.notEqual(info.mode & 0o100, 0);
  assertMatches(source, /--diff-filter=ACMRD/);
  assertMatches(source, /is_source_file/);
  assertMatches(source, /is_maintenance_only_path/);
  assertMatches(source, /is_preview_safe_path/);
  assertMatches(source, /CHANGED_FILES\[@\].*== 0/);
  assertMatches(source, /maintenance_only=false/);
  assertMatches(source, /preview_required=true/);
  assertMatches(source, /dependencies=true/);
  assertMatches(source, /if ! is_maintenance_only_path/);
  assertMatches(source, /if ! is_preview_safe_path/);
  assertMatches(source, /application=true/);
  assertMatches(source, /build=true/);
  assertMatches(source, /sast=true/);
  assertMatches(source, /zap_bootstrap=true/);
  assertMatches(source, /BASE_REF="\$\{1:-\$\(resolve_base_ref\)\}"/);
  assertMatches(source, /HEAD_REF="\$\{2:-HEAD\}"/);
});

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
  assertNotMatches(
    source.slice(maintenanceStart, previewStart),
    /\.github\/\*/,
  );
  assertMatches(source.slice(previewStart), /\.github\/\*/);
  assertNotMatches(source, /\.opencode\/agents\/\*\.md/);
  assertNotMatches(source, /\.opencode\/commands\/\*\.md/);
});

test("maintenance CI avoids Semgrep, Next build and dependency scanning", async () => {
  const workflow = await read("../.github/workflows/ci.yml");

  assertMatches(workflow, /- name: Classify CI change scope/);
  assertMatches(workflow, /id: ci-scope/);
  assertMatches(
    workflow,
    /bash scripts\/ci-scope\.sh "\$\{BASE_SHA\}" "\$\{HEAD_SHA\}"/,
  );
  assertMatches(workflow, /steps\.ci-scope\.outputs\.sast == 'true'/);
  assertMatches(workflow, /steps\.ci-scope\.outputs\.build == 'true'/);
  assertMatches(workflow, /steps\.ci-scope\.outputs\.build != 'true'/);
  assertMatches(workflow, /steps\.ci-scope\.outputs\.dependencies == 'true'/);
  assertMatches(workflow, /steps\.ci-scope\.outputs\.application/);
  assertNotMatches(workflow, /outputs\.full_project/);
  assertMatches(workflow, /- name: Run maintenance project checks/);
  assertMatches(
    workflow,
    /npm run lint\n\s+npm run lint:css\n\s+npm run test:unit/,
  );
  assertMatches(workflow, /grep -E '[^\n]*\\\.github\/workflows\/.*\\\.ya\?ml/);
  assertMatches(
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
  assertMatches(block, /github\.event\.pull_request\.draft == false/);
  assertMatches(block, /steps\.ci-scope\.outputs\.sast == 'true'/);
  assertMatches(block, /steps\.semgrep-sast\.outcome != 'success'/);
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
  const preflight = workflow.indexOf(
    "- name: Run agent preflight before dependency install",
  );
  const canonicalGate = workflow.indexOf(
    "- name: Run canonical changed-file quality gate before network/SAST/npm bootstrap",
  );
  const baselineGate = workflow.indexOf(
    "- name: Verify current production baseline before PR build",
  );
  const liveGate = workflow.indexOf(
    "- name: Revalidate canonical production smoke before PR build",
  );
  const setupNode = workflow.indexOf("- name: Setup Node.js");
  assert.ok(
    preflight >= 0 &&
      canonicalGate > preflight &&
      baselineGate > canonicalGate &&
      liveGate > baselineGate &&
      setupNode > liveGate,
  );
  assertMatches(workflow, /statuses:\s*read/);
  assertMatches(
    workflow,
    /BASE_SHA: \$\{\{ steps\.current-heads\.outputs\.production-sha \}\}/,
  );
  assertNotMatches(workflow, /github\.event\.pull_request\.base\.sha/);
  assertMatches(workflow, /bash scripts\/verify-production-baseline\.sh/);
  assertMatches(
    baseline,
    /source "\$\{SCRIPT_DIR\}\/lib\/production-baseline-classification\.sh"/,
  );
  assertMatches(
    workflow,
    /VERCEL_AUTOMATION_BYPASS_SECRET: \$\{\{ secrets\.VERCEL_AUTOMATION_BYPASS_SECRET \}\}/,
  );
  assertMatches(workflow, /PRODUCTION_LIVE_ALLOW_MISSING_SECRET: "1"/);
  assertMatches(workflow, /bash scripts\/verify-production-live\.sh/);
  assertMatches(live, /PROD_LIVE_CREDENTIAL_UNAVAILABLE/);
  assertMatches(live, /PRODUCTION_LIVE_ALLOW_MISSING_SECRET/);

  for (const context of [
    "Vercel",
    "Production Post-deploy Smoke",
    "Production DAST",
  ]) {
    assert.ok(baseline.includes(`"${context}"`));
  }
  assertMatches(baseline, /vercel_state/);
  assertMatches(
    baseline,
    /production-only statuses are absent on metadata-only release/,
  );
  assertMatches(baselineClassification, /chore\(release\):/);
  assertMatches(baselineClassification, /\[skip ci\]/);
  assertMatches(
    baselineClassification,
    /package\.json changed beyond version metadata/,
  );
  assertMatches(
    baselineClassification,
    /package-lock\.json changed beyond root version metadata/,
  );
  assertMatches(
    baselineClassification,
    /parent .* has inconsistent package\/lock versions/,
  );
  assertMatches(
    baselineClassification,
    /release .* has inconsistent package\/lock versions/,
  );
  assertMatches(
    baselineClassification,
    /release subject does not match package version/,
  );
  assertMatches(baselineClassification, /PROD_BASE_RELEASE_VERSION/);
  assertMatches(baselineClassification, /PROD_BASE_RELEASE_GRAPH/);
  assertMatches(
    baselineClassification,
    /baseline inheritance requires a linear single-parent release commit/,
  );
  assertMatches(
    baselineClassification,
    /production release hop must use stable numeric SemVer/,
  );
  assertMatches(
    baselineClassification,
    /does not monotonically advance package version/,
  );
  assertMatches(baseline, /PROD_BASE_UNHEALTHY/);
  assertMatches(baselineClassification, /PROD_BASE_RELEASE_SCOPE/);

  for (const path of ["/", "/index.html", "/test", "/contact", "/policy"]) {
    assert.ok(live.includes(`probe "${path}"`));
  }
  assertMatches(live, /PROD_LIVE_CHECKPOINT/);
  assertMatches(live, /x-vercel-mitigated/);
  assert.ok(
    live.includes("vercel\\.com/(login|sso-api)"),
    "production live check must detect Vercel login/SSO redirects",
  );
  assertMatches(live, /--connect-timeout 5/);
  assertMatches(live, /--max-time 15/);
});

test("CI performance budgets are warning-only and derived from observed headroom", async () => {
  const [workflow, budget, info] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/ci-performance-budget.sh"),
    stat(new URL("../scripts/ci-performance-budget.sh", import.meta.url)),
  ]);

  assert.notEqual(info.mode & 0o100, 0);
  assertMatches(workflow, /- name: Check CI performance warning budgets/);
  assertMatches(workflow, /bash scripts\/ci-performance-budget\.sh/);
  assertMatches(budget, /NPM_CI_WARN_SECONDS=.*30/);
  assertMatches(budget, /NODE_MODULES_WARN_MB=.*800/);
  assertMatches(budget, /FULL_CHECK_WARN_SECONDS=.*60/);
  assertMatches(budget, /NEXT_BUILD_WARN_SECONDS=.*30/);
  assertMatches(budget, /NEXT_OUTPUT_WARN_MB=.*80/);
  assertMatches(budget, /::warning::CI performance regression candidate/);
  assertMatches(budget, /quality result remains non-blocking/);
  assertNotMatches(budget, /exit 1/);
});

test("CI performance emits a toolchain-aware exact-checkout baseline record without artifacts", async () => {
  const [workflow, budget] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/ci-performance-budget.sh"),
  ]);

  assertMatches(budget, /CI_PERF_BASELINE schema=2 run=/);
  assertNotMatches(budget, /CI_PERF_BASELINE schema=1 run=/);
  assertMatches(budget, /GITHUB_RUN_ID/);
  assertMatches(budget, /GITHUB_RUN_NUMBER/);
  assertMatches(budget, /GITHUB_RUN_ATTEMPT/);
  assertMatches(budget, /GITHUB_HEAD_REF/);
  assertMatches(budget, /GITHUB_REF_NAME/);
  assertMatches(budget, /RUNNER_OS/);
  assertMatches(budget, /RUNNER_ARCH/);
  assertMatches(budget, /node --version/);
  assertMatches(budget, /npm --version/);
  assertMatches(budget, /git rev-parse HEAD/);
  assertNotMatches(budget, /sha=\$\(value_or_na "\$\{GITHUB_SHA/);
  assertMatches(budget, /GITHUB_EVENT_NAME/);
  assertMatches(budget, /scope=\$\{quality_scope\}/);
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
  assertMatches(budget, /Copy-ready baseline record/);
  assertNotMatches(workflow, /ci-performance.*upload-artifact/is);
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
    assertMatches(
      workflow,
      /package-manager-cache:\s*false/,
      `${name} must disable setup-node npm cache`,
    );
    assertMatches(
      workflow,
      /path:\s*~\/\.npm/,
      `${name} must retain explicit npm cache ownership`,
    );
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

  assertMatches(preCommit, /^fail_fast: false/m);
  assertNotMatches(preCommit, /pre-commit-update/);
  assertMatches(
    preCommit,
    /repo: https:\/\/github\.com\/pre-commit\/pre-commit\.git[\s\S]*?rev: v4\.6\.2/,
  );
  assertMatches(preCommit, /id: ruff-format/);
  assertMatches(preCommit, /id: ruff-check/);
  assertMatches(preCommit, /args: \[--fix, --unsafe-fixes\]/);
  assertNotMatches(preCommit, /id: ruff\n/);
  assertNotMatches(preCommit, /pre-commit-stylelint|id: stylelint|stylelint@/);
  assertMatches(
    preCommit,
    /id: shfmt-docker[\s\S]*?args: \["-i", "4", "-ci"\]/,
  );
  assertMatches(preCommit, /id: bashate[\s\S]*?args: \[-i, "E002,E003,E006"\]/);
  assert.equal(pkg.devDependencies?.stylelint, "^17.14.1");
  assertMatches(pkg.scripts?.["lint:css"] ?? "", /^stylelint /);
  assertNotMatches(mise, /--hook-type commit-msg/);
  assertMatches(mise, /\[tasks\.hooks-update\]/);
  assertMatches(mise, /pre-commit autoupdate/);
});

test("Copilot setup stays available but does not spend installs on draft synchronization", async () => {
  const setup = await read("../.github/workflows/copilot-setup-steps.yml");

  assertMatches(setup, /workflow_dispatch:/);
  assertMatches(
    setup,
    /types: \[opened, synchronize, reopened, ready_for_review\]/,
  );
  assertMatches(
    setup,
    /group: copilot-setup-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/,
  );
  assertMatches(setup, /cancel-in-progress: true/);
  assertMatches(
    setup,
    /if: github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false/,
  );
  assertMatches(setup, /timeout-minutes: 15/);
});

test("retired asset metadata stays maintenance-only and absent", async () => {
  const [workflow, scope] = await Promise.all([
    read("../.github/workflows/ci.yml"),
    read("../scripts/ci-scope.sh"),
  ]);

  assert.equal((workflow.match(/- "\.assetsignore"/g) ?? []).length, 2);
  assertMatches(scope, /\.assetsignore/);
  await assert.rejects(
    stat(new URL("../.assetsignore", import.meta.url)),
    /ENOENT/,
  );
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

  assertMatches(
    workflow,
    /needs\.quality\.outputs\.preview_required == 'true'/,
  );
  assertNotMatches(workflow, /const safeOnly/);
  assertNotMatches(workflow, /deployRelevant/);
});
