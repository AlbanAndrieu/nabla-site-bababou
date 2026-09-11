import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
	return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("pre-commit keeps one Ruff lint path and delegates CSS authority to npm Stylelint", async () => {
	const [preCommit, packageRaw] = await Promise.all([
		read("../.pre-commit-config.yaml"),
		read("../package.json"),
	]);
	const pkg = JSON.parse(packageRaw) as { scripts: Record<string, string> };

	assert.doesNotMatch(preCommit, /thibaudcolas\/pre-commit-stylelint/);
	assert.doesNotMatch(preCommit, /^\s*-\s+id:\s+ruff\s*$/m);
	assert.match(preCommit, /^\s*-\s+id:\s+ruff-format\s*$/m);
	assert.match(preCommit, /^\s*-\s+id:\s+ruff-check\s*$/m);
	assert.match(preCommit, /args:\s*\[--fix, --unsafe-fixes\]/);

	assert.match(pkg.scripts["lint:css"], /^stylelint /);
	assert.match(pkg.scripts["lint:css:fix"], /^stylelint --fix /);
});
