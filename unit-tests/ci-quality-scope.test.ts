import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
	return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("quality scope helper is executable and conservative about runtime changes", async () => {
	const url = new URL("../scripts/ci-quality-scope.sh", import.meta.url);
	const [source, info] = await Promise.all([read("../scripts/ci-quality-scope.sh"), stat(url)]);

	assert.notEqual(info.mode & 0o100, 0);
	for (const runtimePath of [
		"package.json | package-lock.json",
		"next.config.* | proxy.ts",
		"app/* | components/* | i18n/* | lib/* | messages/* | public/* | api/*",
		"scripts/*",
	]) {
		assert.ok(source.includes(runtimePath));
	}
	assert.match(source, /FULL_PROJECT=true/);
	assert.match(source, /DEPENDENCIES=true/);
	assert.match(source, /SAST=true/);
});

test("known quality orchestration files stay maintenance-only", async () => {
	const source = await read("../scripts/ci-quality-scope.sh");

	for (const path of [
		"scripts/agent-quality-gate.sh",
		"scripts/quality-gate.sh",
		"scripts/ci-quality-scope.sh",
		"scripts/verify-production-baseline.sh",
		"scripts/verify-production-live.sh",
		"scripts/ci-performance-budget.sh",
	]) {
		assert.ok(source.includes(path), `${path} must stay maintenance-only`);
	}
	assert.doesNotMatch(source, /\.github\/workflows\/.*SAST=true/s);
});

test("maintenance CI avoids Semgrep, Next build and dependency scanning", async () => {
	const workflow = await read("../.github/workflows/ci.yml");

	assert.match(workflow, /- name: Classify quality scope/);
	assert.match(workflow, /steps\.scope\.outputs\.sast == 'true'/);
	assert.match(workflow, /steps\.scope\.outputs\.full_project == 'true'/);
	assert.match(workflow, /steps\.scope\.outputs\.full_project != 'true'/);
	assert.match(workflow, /steps\.scope\.outputs\.dependencies == 'true'/);
	assert.match(workflow, /- name: Run maintenance project checks/);
	assert.match(workflow, /npm run lint\n\s+npm run lint:css\n\s+npm run test:unit/);
	assert.doesNotMatch(
		workflow,
		/grep -E '[^\n]*\.github\/workflows\/.*\\\.ya\?ml/,
	);
});

test("draft Semgrep enforcement cannot fail a skipped scan", async () => {
	const workflow = await read("../.github/workflows/ci.yml");
	const enforceStart = workflow.indexOf("- name: Enforce Semgrep SAST");
	const setupNode = workflow.indexOf("- name: Setup Node.js", enforceStart);
	const block = workflow.slice(enforceStart, setupNode);

	assert.ok(enforceStart >= 0);
	assert.match(block, /github\.event\.pull_request\.draft == false/);
	assert.match(block, /steps\.scope\.outputs\.sast == 'true'/);
	assert.match(block, /steps\.semgrep-sast\.outcome != 'success'/);
});

test("production baseline and live smoke run before dependency installation", async () => {
	const [workflow, baseline, live, baselineInfo, liveInfo] = await Promise.all([
		read("../.github/workflows/ci.yml"),
		read("../scripts/verify-production-baseline.sh"),
		read("../scripts/verify-production-live.sh"),
		stat(new URL("../scripts/verify-production-baseline.sh", import.meta.url)),
		stat(new URL("../scripts/verify-production-live.sh", import.meta.url)),
	]);

	assert.notEqual(baselineInfo.mode & 0o100, 0);
	assert.notEqual(liveInfo.mode & 0o100, 0);
	const preflight = workflow.indexOf("- name: Run agent preflight before dependency install");
	const baselineGate = workflow.indexOf("- name: Verify current production baseline before PR build");
	const liveGate = workflow.indexOf("- name: Revalidate canonical production smoke before PR build");
	const setupNode = workflow.indexOf("- name: Setup Node.js");
	assert.ok(
		preflight >= 0 && baselineGate > preflight && liveGate > baselineGate && setupNode > liveGate,
	);
	assert.match(workflow, /statuses:\s*read/);
	assert.match(workflow, /BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
	assert.match(workflow, /bash scripts\/verify-production-baseline\.sh/);
	assert.match(workflow, /VERCEL_AUTOMATION_BYPASS_SECRET: \$\{\{ secrets\.VERCEL_AUTOMATION_BYPASS_SECRET \}\}/);
	assert.match(workflow, /bash scripts\/verify-production-live\.sh/);

	for (const context of ["Vercel", "Production Post-deploy Smoke", "Production DAST"]) {
		assert.ok(baseline.includes(`\"${context}\"`));
	}
	assert.match(baseline, /Canceled by Ignored Build Step/);
	assert.match(baseline, /chore\\\(release\\\):/);
	assert.match(baseline, /\[skip ci\]/);
	assert.match(baseline, /package\.json changed beyond version metadata/);
	assert.match(baseline, /package-lock\.json changed beyond root version metadata/);
	assert.match(baseline, /PROD_BASE_UNHEALTHY/);
	assert.match(baseline, /PROD_BASE_RELEASE_SCOPE/);

	for (const path of ["/", "/index.html", "/test", "/contact", "/policy"]) {
		assert.ok(live.includes(`probe \"${path}\"`));
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

test("quality-only files do not trigger an application Preview checkpoint", async () => {
	const workflow = await read("../.github/workflows/ci.yml");

	for (const path of [
		".pre-commit-config.yaml",
		".pre-commit-pre-push.yaml",
		"mise.toml",
		"scripts/agent-quality-gate.sh",
		"scripts/ci-quality-scope.sh",
		"scripts/verify-production-baseline.sh",
		"scripts/verify-production-live.sh",
		"scripts/ci-performance-budget.sh",
		"scripts/quality-gate.sh",
	]) {
		assert.ok(workflow.includes(`filename === '${path}'`));
	}
});
