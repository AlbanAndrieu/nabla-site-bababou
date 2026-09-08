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
		"--preflight",
		"--fix",
		"--publish",
		"npm run check",
		"bash scripts/quality-gate.sh",
	]) {
		assert.match(source, new RegExp(token.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
	}
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
	assert.equal(nvmrc.trim(), "v25.9.0");
	assert.match(mise, /default='3\.13'/);
	assert.match(mise, /pre-commit = "4\.6\.2"/);
	assert.match(setup, /python-version-file: "\.python-version"/);
	assert.match(setup, /pre-commit==4\.6\.2/);
	assert.match(setup, /npm ci --no-audit --no-fund/);
	for (const input of [
		".nvmrc",
		".python-version",
		".pre-commit-config.yaml",
		"mise.toml",
		"package.json",
		"package-lock.json",
		"scripts/agent-quality-gate.sh",
	]) {
		assert.ok(setup.includes("- " + input), "Copilot bootstrap trigger must include " + input);
	}
	assert.match(ci, /- "\.nvmrc"/);
	assert.match(ci, /- "\.python-version"/);
});

test("CI and Copilot caches are best effort and Next build cache is reusable", async () => {
	const [ci, setup] = await Promise.all([
		read("../.github/workflows/ci.yml"),
		read("../.github/workflows/copilot-setup-steps.yml"),
	]);

	for (const workflow of [ci, setup]) {
		assert.match(workflow, /actions\/cache\/restore@v5/);
		assert.match(workflow, /actions\/cache\/save@v5/);
		assert.match(workflow, /continue-on-error: true/);
		assert.doesNotMatch(workflow, /uses: actions\/cache@v5/);
	}

	assert.match(setup, /pre-commit install-hooks/);
	assert.match(setup, /hashFiles\('\.pre-commit-config\.yaml', '\.python-version'\)/);
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
	const fullGateCondition =
		"github.event_name != 'pull_request' || github.event.pull_request.draft == false";

	assert.match(workflow, /types: \[opened, synchronize, reopened, ready_for_review\]/);
	assert.match(workflow, /github\.event\.pull_request\.draft == true/);
	assert.match(workflow, /Draft PR preflight/);

	for (const step of [
		"Setup Node.js",
		"Cache npm downloads",
		"Pin npm",
		"Install dependencies",
		"Run canonical project checks",
	]) {
		assert.ok(
			workflow.includes("- name: " + step + "\n        if: " + fullGateCondition),
			step + " must be deferred for draft PRs",
		);
	}
});

test("agent policy requires fix-check-publish and preserves API-only disclosure", async () => {
	const agents = await read("../AGENTS.md");

	assert.match(agents, /scripts\/agent-quality-gate\.sh --fix/);
	assert.match(agents, /scripts\/agent-quality-gate\.sh --publish/);
	assert.match(agents, /API-only agent/i);
	assert.match(agents, /must never claim that the local quality gate passed/i);
	assert.match(agents, /compact local agent gate output/i);
});
