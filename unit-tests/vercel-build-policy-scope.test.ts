import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

async function read(relativePath: string) {
	return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("Vercel ignored-build policy changes stay deploy-relevant", async (t) => {
	const [scope, workflow, vercelConfig] = await Promise.all([
		read("../scripts/ci-scope.sh"),
		read("../.github/workflows/ci.yml"),
		read("../vercel.json"),
	]);

	assert.match(
		vercelConfig,
		/"ignoreCommand":\s*"bash scripts\/vercel-ignore-build\.sh"/,
		"vercel-ignore-build.sh must remain the configured Vercel ignoreCommand",
	);
	assert.equal(
		workflow.includes("filename === 'scripts/vercel-ignore-build.sh'"),
		false,
		"Vercel deployment policy must not be safe-listed out of exact-SHA Preview gates",
	);

	const repo = await mkdtemp(join(tmpdir(), "bababou-quality-scope-"));
	t.after(async () => {
		await rm(repo, { recursive: true, force: true });
	});

	const git = (...args: string[]) =>
		execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();

	git("init", "--quiet");
	git("config", "user.name", "Quality Scope Test");
	git("config", "user.email", "quality-scope@example.invalid");
	await mkdir(join(repo, "scripts"), { recursive: true });
	await writeFile(join(repo, "scripts/ci-scope.sh"), scope);
	await chmod(join(repo, "scripts/ci-scope.sh"), 0o755);
	await writeFile(join(repo, "scripts/vercel-ignore-build.sh"), "baseline\n");
	git("add", ".");
	git("commit", "--quiet", "-m", "test: baseline");
	const base = git("rev-parse", "HEAD");

	await writeFile(join(repo, "scripts/vercel-ignore-build.sh"), "changed\n");
	git("add", "scripts/vercel-ignore-build.sh");
	git("commit", "--quiet", "-m", "test: change Vercel build policy");

	const output = execFileSync("bash", ["scripts/ci-scope.sh", base, "HEAD"], {
		cwd: repo,
		encoding: "utf8",
	});

	assert.match(output, /^maintenance_only=false$/m);
	assert.match(output, /^application=true$/m);
	assert.match(output, /^sast=true$/m);
	assert.match(output, /^build=true$/m);
	assert.match(output, /^dependencies=false$/m);
	assert.match(output, /^changed_count=1$/m);
});
