import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
	return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("agent gate is executable and wraps the canonical site checks", async () => {
	const gateUrl = new URL("../scripts/agent-quality-gate.sh", import.meta.url);
	const [source, info] = await Promise.all([read("../scripts/agent-quality-gate.sh"), stat(gateUrl)]);

	assert.notEqual(info.mode & 0o100, 0);
	for (const token of [
		"QG_BASE_MISSING",
		"QG_BASE_STALE",
		"QG_LARGE_DELETION",
		"QG_EXEC_BIT",
		"QG_DIRTY_TREE",
		"QG_PUBLISH_CACHE",
		"QUALITY_FORCE_PUBLISH",
		"--preflight",
		"--fix",
		"--publish",
		"npm run check",
		"bash scripts/quality-gate.sh",
	]) {
		assert.match(source, new RegExp(token.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
	}
});

test("cheap formatter/linter gate runs before the expensive npm/Next gate", async () => {
	const source = await read("../scripts/agent-quality-gate.sh");
	const canonical = source.lastIndexOf('run_compact "canonical formatter/linter/security');
	const full = source.lastIndexOf('run_compact "Next/npm lint, types, unit, privacy and production build gate"');

	assert.ok(canonical >= 0);
	assert.ok(full > canonical);
});

test("fix mode scopes project ESLint and Stylelint before pre-commit convergence", async () => {
	const source = await read("../scripts/agent-quality-gate.sh");

	assert.match(source, /run_compact "ESLint local auto-fix" npm run lint:fix/);
	assert.match(source, /npx eslint --fix --format \.\/scripts\/eslint-github-formatter\.mjs "\$\{javascript_lint_files\[@\]\}"/);
	assert.match(source, /run_compact "Stylelint local auto-fix" npm run lint:css:fix/);
	assert.match(source, /npx stylelint --fix "\$\{stylelint_files\[@\]\}"/);
	assert.match(source, /precommit_fix_until_stable/);
});

test("strict validation records an exact local proof reusable by publish and pre-push", async () => {
	const source = await read("../scripts/agent-quality-gate.sh");

	assert.match(source, /git rev-parse --git-path nabla-agent-quality\.stamp/);
	assert.match(source, /node_modules\/\.package-lock\.json/);
	assert.match(source, /node --version/);
	assert.match(source, /npm --version/);
	assert.match(source, /pre-commit --version/);
	assert.match(source, /printf '%s\\n' "\$\{STAMP_KEY\}" >"\$\{STAMP_PATH\}"/);
	assert.match(source, /QUALITY_FORCE_PUBLISH:-0/);
});

test("npm, mise and pre-push expose the agent workflow", async () => {
	const [packageSource, mise, prePush] = await Promise.all([
		read("../package.json"),
		read("../mise.toml"),
		read("../.pre-commit-pre-push.yaml"),
	]);
	const pkg = JSON.parse(packageSource) as { scripts: Record<string, string> };

	assert.equal(pkg.scripts["quality:gate"], "bash scripts/quality-gate.sh");
	assert.equal(pkg.scripts["agent:fix"], "bash scripts/agent-quality-gate.sh --fix");
	assert.equal(pkg.scripts["agent:quality"], "bash scripts/agent-quality-gate.sh");
	assert.equal(pkg.scripts["agent:publish"], "bash scripts/agent-quality-gate.sh --publish");

	for (const task of ["[tasks.agent-fix]", "[tasks.agent-quality]", "[tasks.agent-publish]"]) {
		assert.match(mise, new RegExp(task.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
	}
	assert.match(prePush, /entry: bash scripts\/agent-quality-gate\.sh --publish/);
});

test("agent bootstrap toolchain is pinned and complete", async () => {
	const [mise, pythonVersion, nvmrc, ci, setup] = await Promise.all([
		read("../mise.toml"),
		read("../.python-version"),
		read("../.nvmrc"),
		read("../.github/workflows/ci.yml"),
		read("../.github/workflows/copilot-setup-steps.yml"),
	]);

	assert.equal(pythonVersion.trim(), "3.13");
	assert.equal(nvmrc.trim(), "v26.8.2");
	assert.match(mise, /node = "26\.8\.2"/);
	assert.match(mise, /default='3\.13'/);
	assert.match(mise, /pre-commit = "4\.6\.2"/);
	assert.match(setup, /python-version-file: "\.python-version"/);
	assert.match(setup, /pre-commit==4\.6\.2/);
	assert.match(setup, /npm ci --no-audit --no-fund/);
	for (const input of [
		".nvmrc",
		".python-version",
		".pre-commit-config.yaml",
		".pre-commit-pre-push.yaml",
		"mise.toml",
		"package.json",
		"package-lock.json",
		"scripts/agent-quality-gate.sh",
	]) {
		assert.ok(setup.includes("- " + input), "Copilot bootstrap trigger must include " + input);
	}
	for (const trigger of [
		'- ".envrc"',
		'- ".nvmrc"',
		'- ".python-version"',
		'- ".vscode/**"',
		'- ".github/copilot-instructions*.md"',
		'- "SECURITY.md"',
		'- "mise.toml"',
	]) {
		assert.equal(
			ci.split(trigger).length - 1,
			2,
			`${trigger} must trigger Quality on pull_request and master push`,
		);
	}
});

test("CI and Copilot caches are best effort and Next build cache is reusable", async () => {
	const [ci, setup] = await Promise.all([
		read("../.github/workflows/ci.yml"),
		read("../.github/workflows/copilot-setup-steps.yml"),
	]);

	for (const workflow of [ci, setup]) {
		assert.ok(workflow.includes("actions/cache/restore@caa296126883cff596d87d8935842f9db880ef25"));
		assert.ok(workflow.includes("actions/cache/save@caa296126883cff596d87d8935842f9db880ef25"));
		assert.match(workflow, /continue-on-error: true/);
		assert.doesNotMatch(workflow, /uses: actions\/cache(?:\/(?:restore|save))?@v5/);
	}

	assert.match(setup, /pre-commit install-hooks/);
	assert.match(
		setup,
		/pre-commit-v4\.6\.2-\$\{\{ runner\.os \}\}-\$\{\{ hashFiles\('\.pre-commit-config\.yaml', '\.pre-commit-pre-push\.yaml', '\.python-version', '\.nvmrc'\) \}\}/,
	);
	assert.match(ci, /Restore Next build cache/);
	assert.match(ci, /Save Next build cache/);
	assert.match(ci, /path: \.next\/cache/);
	assert.match(ci, /NEXT_CACHE_HIT/);
});

test("CI runs the Git-only agent preflight before Node and dependency installation", async () => {
	const workflow = await read("../.github/workflows/ci.yml");
	const preflight = workflow.indexOf("Run agent preflight before dependency install");
	const setupNode = workflow.indexOf("Setup Node.js");
	const install = workflow.indexOf("Install dependencies");

	assert.ok(preflight >= 0);
	assert.ok(setupNode > preflight);
	assert.ok(install > setupNode);
	assert.match(workflow, /fetch-depth: 0/);
	assert.match(workflow, /github\.event\.pull_request\.head\.sha \|\| github\.ref/);
	assert.match(workflow, /QUALITY_BASE_REF: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
	assert.match(workflow, /bash scripts\/agent-quality-gate\.sh --preflight/);
});

test("draft PRs run only the Git preflight until ready for review", async () => {
	const workflow = await read("../.github/workflows/ci.yml");

	assert.match(workflow, /types: \[opened, synchronize, reopened, ready_for_review\]/);
	assert.match(workflow, /github\.event\.pull_request\.draft == true/);
	assert.match(workflow, /Draft PR preflight/);

	for (const step of [
		"Classify quality scope",
		"Run Semgrep SAST on changed source",
		"Setup Node.js",
		"Restore npm downloads",
		"Restore Next build cache",
		"Pin npm",
		"Install dependencies",
		"Run maintenance project checks",
		"Run canonical project checks",
	]) {
		const index = workflow.indexOf(`- name: ${step}`);
		assert.ok(index >= 0, `${step} must exist`);
		const nextStep = workflow.indexOf("\n      - name:", index + 1);
		const block = workflow.slice(index, nextStep >= 0 ? nextStep : undefined);
		assert.match(
			block,
			/github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false/,
			`${step} must be deferred for draft PRs`,
		);
	}
});

test("agent policy keeps local-first validation and API-only disclosure", async () => {
	const agents = await read("../AGENTS.md");

	assert.match(agents, /scripts\/agent-quality-gate\.sh --fix/);
	assert.match(agents, /scripts\/agent-quality-gate\.sh --publish/);
	assert.match(agents, /API-only agent/i);
	assert.match(agents, /must never claim that the local quality gate passed/i);
	assert.match(agents, /compact local agent gate output/i);
});
