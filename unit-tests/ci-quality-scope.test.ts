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

	assert.match(
		source,
		/scripts\/agent-quality-gate\.sh \| scripts\/quality-gate\.sh \| scripts\/ci-quality-scope\.sh/,
	);
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

test("pre-commit converges deterministic hooks without version drift", async () => {
	const [preCommit, mise] = await Promise.all([
		read("../.pre-commit-config.yaml"),
		read("../mise.toml"),
	]);

	assert.match(preCommit, /^fail_fast: false/m);
	assert.doesNotMatch(preCommit, /pre-commit-update/);
	assert.match(preCommit, /stylelint@17\.14\.1/);
	assert.doesNotMatch(preCommit, /stylelint@14\.4\.0/);
	assert.doesNotMatch(preCommit, /stylelint-config-standard-scss/);
	assert.doesNotMatch(mise, /--hook-type commit-msg/);
	assert.match(mise, /\[tasks\.hooks-update\]/);
	assert.match(mise, /pre-commit autoupdate/);
});

test("Copilot setup stays available but does not spend installs on draft synchronization", async () => {
	const setup = await read("../.github/workflows/copilot-setup-steps.yml");

	assert.match(setup, /workflow_dispatch:/);
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
		"scripts/quality-gate.sh",
	]) {
		assert.ok(workflow.includes(`filename === '${path}'`));
	}
});
