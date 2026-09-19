import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const qualityScopeScript = fileURLToPath(
	new URL("../scripts/ci-quality-scope.sh", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

test("deleted runtime files still require the full project quality gate", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "bababou-quality-scope-"));
	t.after(async () => rm(directory, { recursive: true, force: true }));

	git(directory, "init", "--quiet");
	git(directory, "config", "user.name", "Quality Scope Test");
	git(directory, "config", "user.email", "quality-scope@example.invalid");

	await mkdir(join(directory, "app"), { recursive: true });
	await writeFile(join(directory, "app", "runtime.ts"), "export const runtime = true;\n");
	git(directory, "add", "app/runtime.ts");
	git(directory, "commit", "--quiet", "-m", "base");
	const baseSha = git(directory, "rev-parse", "HEAD");

	git(directory, "rm", "--quiet", "app/runtime.ts");
	git(directory, "commit", "--quiet", "-m", "delete runtime");

	const result = spawnSync("bash", [qualityScopeScript], {
		cwd: directory,
		encoding: "utf8",
		env: {
			...process.env,
			QUALITY_SCOPE_BASE_REF: baseSha,
			QUALITY_SCOPE_HEAD_REF: "HEAD",
		},
	});

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /full_project=true/);
	assert.match(result.stdout, /sast=true/);
	assert.match(result.stdout, /dependencies=false/);
	assert.match(result.stdout, /changed_count=1/);
});
