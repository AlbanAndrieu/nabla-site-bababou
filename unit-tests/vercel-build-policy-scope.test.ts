import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
	return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("Vercel ignored-build policy changes stay deploy-relevant", async () => {
	const [scope, workflow, vercelConfig] = await Promise.all([
		read("../scripts/ci-quality-scope.sh"),
		read("../.github/workflows/ci.yml"),
		read("../vercel.json"),
	]);

	assert.match(
		vercelConfig,
		/"ignoreCommand":\s*"bash scripts\/vercel-ignore-build\.sh"/,
		"vercel-ignore-build.sh must remain the configured Vercel ignoreCommand",
	);

	const deployPolicyCase = scope.indexOf("scripts/vercel-ignore-build.sh)");
	const maintenanceCase = scope.indexOf("scripts/agent-quality-gate.sh", deployPolicyCase);
	assert.ok(deployPolicyCase >= 0, "quality scope must classify vercel-ignore-build.sh explicitly");
	assert.ok(
		maintenanceCase > deployPolicyCase,
		"Vercel deployment policy must be classified before maintenance-only scripts",
	);
	assert.match(
		scope.slice(deployPolicyCase, maintenanceCase),
		/FULL_PROJECT=true/,
		"a Vercel deployment-policy change must run the full project gate",
	);

	assert.equal(
		workflow.includes("filename === 'scripts/vercel-ignore-build.sh'"),
		false,
		"Vercel deployment policy must not be safe-listed out of exact-SHA Preview gates",
	);
});
