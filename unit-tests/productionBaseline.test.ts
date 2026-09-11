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

type ReleaseRepoOptions = {
	extraReleaseFile?: boolean;
	childVersion?: string;
	lockVersion?: string;
	subjectVersion?: string;
	mergeRelease?: boolean;
};

async function writePackageVersion(
	directory: string,
	packageVersion: string,
	lockVersion = packageVersion,
) {
	const packageJson = {
		name: "production-baseline-fixture",
		version: packageVersion,
		private: true,
	};
	const packageLock = {
		name: "production-baseline-fixture",
		version: lockVersion,
		lockfileVersion: 3,
		requires: true,
		packages: {
			"": {
				name: "production-baseline-fixture",
				version: lockVersion,
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

async function createReleaseRepo(options: ReleaseRepoOptions = {}) {
	const {
		extraReleaseFile = false,
		childVersion = "1.0.1",
		lockVersion = childVersion,
		subjectVersion = childVersion,
		mergeRelease = false,
	} = options;
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

	let secondParentSha: string | undefined;
	if (mergeRelease) {
		execFileSync("git", ["commit", "--allow-empty", "-m", "chore: alternate parent"], {
			cwd: directory,
			stdio: "ignore",
		});
		secondParentSha = execFileSync("git", ["rev-parse", "HEAD"], {
			cwd: directory,
			encoding: "utf8",
		}).trim();
		execFileSync("git", ["reset", "--hard", parentSha], {
			cwd: directory,
			stdio: "ignore",
		});
	}

	await writePackageVersion(directory, childVersion, lockVersion);
	await writeFile(
		join(directory, "CHANGELOG.md"),
		`# Changelog\n\n## ${childVersion}\n\n- release metadata\n`,
	);
	if (extraReleaseFile) {
		await writeFile(join(directory, "runtime.txt"), "unexpected runtime change\n");
	}
	execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });

	let releaseSha: string;
	if (secondParentSha) {
		const treeSha = execFileSync("git", ["write-tree"], {
			cwd: directory,
			encoding: "utf8",
		}).trim();
		releaseSha = execFileSync(
			"git",
			[
				"commit-tree",
				treeSha,
				"-p",
				parentSha,
				"-p",
				secondParentSha,
				"-m",
				`chore(release): ${subjectVersion} [skip ci]`,
			],
			{ cwd: directory, encoding: "utf8" },
		).trim();
		execFileSync("git", ["reset", "--hard", releaseSha], {
			cwd: directory,
			stdio: "ignore",
		});
	} else {
		execFileSync("git", ["commit", "-m", `chore(release): ${subjectVersion} [skip ci]`], {
			cwd: directory,
			stdio: "ignore",
		});
		releaseSha = execFileSync("git", ["rev-parse", "HEAD"], {
			cwd: directory,
			encoding: "utf8",
		}).trim();
	}

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

function runBaseline(
	directory: string,
	bin: string,
	releaseSha: string,
	releaseHops = "3",
) {
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
			QUALITY_BASELINE_RELEASE_HOPS: releaseHops,
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

test("production baseline rejects non-success Vercel states before release inheritance", async (t) => {
	const fixture = await createReleaseRepo();
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		[
			{
				context: "Vercel",
				state: "pending",
				description: "Deployment is pending",
				created_at: "2026-09-11T16:05:00Z",
			},
		],
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_UNHEALTHY/);
	assert.match(result.stderr, /Vercel=pending/);
	assert.doesNotMatch(result.stdout, /inheriting the parent production baseline/);
});

test("production baseline rejects a partial production-only status set", async (t) => {
	const fixture = await createReleaseRepo();
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		[
			...previewVercelSuccess,
			{
				context: "Production DAST",
				state: "success",
				description: "Production ZAP passed",
				created_at: "2026-09-11T16:06:00Z",
			},
		],
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_PARTIAL/);
	assert.match(result.stderr, /Production Post-deploy Smoke/);
	assert.doesNotMatch(result.stdout, /inheriting the parent production baseline/);
});

test("production baseline honors a zero semantic-release hop budget", async (t) => {
	const fixture = await createReleaseRepo();
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha, "0");

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_MISSING/);
	assert.match(result.stderr, /Production Post-deploy Smoke/);
	assert.match(result.stderr, /Production DAST/);
	assert.doesNotMatch(result.stdout, /inheriting the parent production baseline/);
});

test("production baseline still rejects release commits that change runtime scope", async (t) => {
	const fixture = await createReleaseRepo({ extraReleaseFile: true });
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

test("production baseline rejects release metadata when package and lock versions diverge", async (t) => {
	const fixture = await createReleaseRepo({ lockVersion: "1.0.2" });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /inconsistent package\/lock versions/);
	assert.match(result.stderr, /cannot inherit an older production baseline/);
});

test("production baseline rejects a semantic-release subject that does not match the published version", async (t) => {
	const fixture = await createReleaseRepo({ subjectVersion: "1.0.2" });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /release subject does not match package version 1\.0\.1/);
	assert.match(result.stderr, /cannot inherit an older production baseline/);
});

test("production baseline rejects metadata-only release merge commits", async (t) => {
	const fixture = await createReleaseRepo({ mergeRelease: true });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /PROD_BASE_RELEASE_GRAPH/);
	assert.match(result.stderr, /baseline inheritance requires a linear single-parent release commit/);
	assert.match(result.stderr, /cannot inherit an older production baseline/);
});

test("production baseline rejects regressive release versions", async (t) => {
	const fixture = await createReleaseRepo({ childVersion: "0.9.9" });
	t.after(async () => rm(fixture.directory, { recursive: true, force: true }));
	const bin = await installCurlMock(
		fixture.directory,
		fixture.releaseSha,
		fixture.parentSha,
		previewVercelSuccess,
	);

	const result = runBaseline(fixture.directory, bin, fixture.releaseSha);

	assert.equal(result.status, 1);
	assert.match(result.stderr, /does not monotonically advance package version 1\.0\.0 -> 0\.9\.9/);
	assert.match(result.stderr, /cannot inherit an older production baseline/);
});
