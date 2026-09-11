import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const baselineScript = fileURLToPath(
	new URL("../scripts/verify-production-baseline.sh", import.meta.url),
);

type Status = {
	context: string;
	state: string;
	description: string;
	created_at: string;
};

async function writePackageVersion(directory: string, version: string) {
	const packageJson = {
		name: "production-baseline-fixture",
		version,
		private: true,
	};
	const packageLock = {
		name: "production-baseline-fixture",
		version,
		lockfileVersion: 3,
		requires: true,
		packages: {
			"": {
				name: "production-baseline-fixture",
				version,
			},
		},
	};

	await writeFile(
		join(directory, "package.json"),
		`${JSON.stringify(packageJson, null, 2)}\n`,
	);
	await writeFile(
		join(directory, "package-lock.json"),
		`${JSON.stringify(packageLock, null, 2)}\n`,
	);
}

async function createReleaseRepo(extraReleaseFile = false) {
	const directory = await mkdtemp(join(tmpdir(), "bababou-production-baseline-"));
	execFileSync("git", ["init"], { cwd: directory, stdio: "ignore" });
	execFileSync("git", ["config", "user.name", "CI"], {
		cwd: directory,
		stdio: "ignore",
	});
	execFileSync("git", ["config", "user.email", "ci@example.invalid"], {
		cwd: directory,
		stdio: "ignore",
	});

	await writePackageVersion(directory, "1.0.0");
	await writeFile(join(directory, "CHANGELOG.md"), "# Changelog\n");
	execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });
	execFileSync("git", ["commit", "-m", "feat: baseline"], {
		cwd: directory,
		stdio: "ignore",
	});
	const parentSha = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: directory,
		encoding: "utf8",
	}).trim();

	await writePackageVersion(directory, "1.0.1");
	await writeFile(
		join(directory, "CHANGELOG.md"),
		"# Changelog\n\n## 1.0.1\n\n- release metadata\n",
	);
	if (extraReleaseFile) {
		await writeFile(join(directory, "runtime.txt"), "unexpected runtime change\n");
	}
	execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });
	execFileSync("git", ["commit", "-m", "chore(release): 1.0.1 [skip ci]"], {
		cwd: directory,
		stdio: "ignore",
	});
	const releaseSha = execFileSync("git", ["rev-parse", "HEAD"], {
		cwd: directory,
		encoding: "utf8",
	}).trim();

	return { directory, parentSha, releaseSha };
}

async function installCurlMock(
	directory: string,
	releaseSha: string,
	parentSha: string,
	releaseStatuses: Status[],
) {
	const bin = join(directory, "bin");
	await mkdir(bin, { recursive: true });
	const curl = join(bin, "curl");
	const healthyStatuses: Status[] = [
		{
			context: "Vercel",
			state: "success",
			description: "Deployment has completed",
			created_at: "2026-09-11T15:00:00Z",
		},
		{
			context: "Production Post-deploy Smoke",
			state: "success",
			description: "Production smoke passed",
			created_at: "2026-09-11T15:01:00Z",
		},
		{
			context: "Production DAST",
			state: "success",
			description: "Production ZAP passed",
			created_at: "2026-09-11T15:02:00Z",
		},
	];
	const script = `#!/usr/bin/env bash
set -euo pipefail
url="\${!#}"
case "\${url}" in
  *"/commits/${releaseSha}/status"*)
    cat <<'JSON'
${JSON.stringify({ statuses: releaseStatuses })}
JSON
    ;;
  *"/commits/${parentSha}/status"*)
    cat <<'JSON'
${JSON.stringify({ statuses: healthyStatuses })}
JSON
    ;;
  *)
    echo "unexpected curl URL: \${url}" >&2
    exit 22
    ;;
esac
`;
	await writeFile(curl, script);
	await chmod(curl, 0o755);
	return bin;
}

function runBaseline(directory: string, bin: string, releaseSha: string) {
	return spawnSync("bash", [baselineScript], {
		cwd: directory,
		encoding: "utf8",
		env: {
			...process.env,
			PATH: `${bin}:${process.env.PATH ?? ""}`,
			BASE_SHA: releaseSha,
			GH_TOKEN: "test-token",
			GITHUB_API_URL: "https://api.github.test",
			GITHUB_REPOSITORY: "example/repository",
			QUALITY_BASELINE_RELEASE_HOPS: "3",
		},
	});
}

const previewVercelSuccess: Status[] = [
	{
		context: "Vercel",
		state: "success",
		description: "Deployment has completed",
		created_at: "2026-09-11T16:05:00Z",
	},
];

test("production baseline inherits across metadata-only release when latest Vercel status is Preview success", async (t) => {
	const fixture = await createReleaseRepo();
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /production-only statuses are absent on metadata-only release/);
	assert.match(
		result.stdout,
		new RegExp(`production baseline healthy at ${fixture.parentSha}`),
	);
});

test("production baseline does not inherit a metadata-only release without a successful Vercel signal", async (t) => {
	const fixture = await createReleaseRepo();
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		[],
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /Vercel is not successful/);
});

test("production baseline still rejects release commits that change runtime scope", async (t) => {
	const fixture = await createReleaseRepo(true);
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /changes unexpected file runtime\.txt/);
	assert.match(result.stderr, /cannot inherit an older production baseline/);
});
