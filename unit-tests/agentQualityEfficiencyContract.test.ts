import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
	return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("agent auto-fix scopes npm linters to changed files with config fallbacks", async () => {
	const [gate, packageRaw] = await Promise.all([
		read("../scripts/agent-quality-gate.sh"),
		read("../package.json"),
	]);
	const pkg = JSON.parse(packageRaw) as { scripts: Record<string, string> };

	assert.equal(pkg.scripts["lint:fix"], "eslint --fix --format ./scripts/eslint-github-formatter.mjs .");
	assert.equal(
		pkg.scripts["lint:css"],
		'stylelint "app/globals.css" "app/**/*.module.css" "components/**/*.module.css" "public/*.css"',
	);
	assert.equal(
		pkg.scripts["lint:css:fix"],
		'stylelint --fix "app/globals.css" "app/**/*.module.css" "components/**/*.module.css" "public/*.css"',
	);
	assert.ok(!pkg.scripts["lint:css"].includes('"app/**/*.css"'), "must not traverse app/public symlink into legacy CSS");

	assert.match(gate, /eslint\.config\.js\)/);
	assert.match(gate, /stylelint\.config\.cjs\)/);
	assert.match(
		gate,
		/npx eslint --fix --format \.\/scripts\/eslint-github-formatter\.mjs "\$\{javascript_lint_files\[@\]\}"/,
	);
	assert.match(gate, /npx stylelint --fix "\$\{stylelint_files\[@\]\}"/);
	assert.match(gate, /run_compact "ESLint local auto-fix" npm run lint:fix/);
	assert.match(gate, /run_compact "Stylelint local auto-fix" npm run lint:css:fix/);
});

test("agent and canonical gates emit compact machine-actionable deterministic failures", async () => {
	const [agentGate, canonicalGate] = await Promise.all([
		read("../scripts/agent-quality-gate.sh"),
		read("../scripts/quality-gate.sh"),
	]);

	assert.match(agentGate, /QUALITY_LOG_TAIL:-40/);
	assert.match(agentGate, /QUALITY_FIX_MAX_PASSES:-12/);
	assert.match(agentGate, /QG_PRECOMMIT_FAILED/);
	assert.match(agentGate, /QG_FIX_DID_NOT_CONVERGE/);
	assert.match(agentGate, /QG_NODE_FIX_SKIPPED/);

	assert.match(canonicalGate, /QG_AUTOFIX_REQUIRED/);
	assert.match(canonicalGate, /QG_PRECOMMIT_FAILED/);
	assert.match(canonicalGate, /--- exact formatter patch ---/);
	assert.match(canonicalGate, /git diff --no-ext-diff/);
	assert.match(canonicalGate, /--fail-fast/);
	assert.match(canonicalGate, /QUALITY_SHOW_DIFF/);
	assert.match(canonicalGate, /QUALITY_LOG_TAIL:-40/);
});
