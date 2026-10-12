import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const policyScript = fileURLToPath(
  new URL("../scripts/vercel-ignore-build.sh", import.meta.url),
);

async function createRepo(
  subject: string,
  changedPath: string,
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "bababou-vercel-ignore-"));

  execFileSync("git", ["init"], { cwd: directory, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "CI"], {
    cwd: directory,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.email", "ci@example.invalid"], {
    cwd: directory,
    stdio: "ignore",
  });

  await writeFile(join(directory, "baseline.txt"), "baseline\n");
  execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "chore: baseline"], {
    cwd: directory,
    stdio: "ignore",
  });

  const target = join(directory, changedPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${subject}\n`);
  execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", subject], {
    cwd: directory,
    stdio: "ignore",
  });

  return directory;
}

function runPolicy(directory: string, env: NodeJS.ProcessEnv = {}) {
  const previousSha = execFileSync("git", ["rev-parse", "HEAD^"], {
    cwd: directory,
    encoding: "utf8",
  }).trim();
  return spawnSync("bash", [policyScript], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_GIT_PREVIOUS_SHA: previousSha,
      ...env,
    },
  });
}

test("Vercel skips semantic-release metadata commits", async (t) => {
  const directory = await createRepo(
    "chore(release): 0.2.1 [skip ci]",
    "package.json",
  );
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Semantic-release metadata commit detected/);
});

test("Vercel still builds deploy-relevant commits", async (t) => {
  const directory = await createRepo("fix: update runtime", "next.config.mjs");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory);

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Deploy-relevant change detected/);
});

test("Vercel builds when the previous deployed SHA is unknown", async (t) => {
  const directory = await createRepo("docs: uncertain base", "docs/roadmap.md");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory, { VERCEL_GIT_PREVIOUS_SHA: "" });

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /No verified previous deployment SHA; build/);
});

test("Vercel always builds validated Preview checkpoint refs", async (t) => {
  const directory = await createRepo(
    "docs: checkpoint metadata",
    "docs/roadmap.md",
  );
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory, {
    VERCEL_GIT_COMMIT_REF: "vercel-preview-pr-154",
  });

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Validated checkpoint vercel-preview-pr-154/);
});

test("Vercel still skips documentation-only commits", async (t) => {
  const directory = await createRepo(
    "docs: refresh roadmap",
    "docs/roadmap.md",
  );
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /skip Vercel deployment/);
});

test("Vercel skips retired Cloudflare asset metadata", async (t) => {
  const directory = await createRepo(
    "chore: retire asset metadata",
    ".assetsignore",
  );
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /retired asset metadata/);
});

test("Vercel compares against the previous deployed SHA across multi-commit changes", async (t) => {
  const directory = await createRepo(
    "fix: runtime baseline",
    "next.config.mjs",
  );
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const previousSha = execFileSync("git", ["rev-parse", "HEAD^"], {
    cwd: directory,
    encoding: "utf8",
  }).trim();

  await mkdir(join(directory, "docs"), { recursive: true });
  await writeFile(join(directory, "docs", "roadmap.md"), "docs only\n");
  execFileSync("git", ["add", "."], { cwd: directory, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "docs: explain runtime change"], {
    cwd: directory,
    stdio: "ignore",
  });

  const result = runPolicy(directory, {
    VERCEL_GIT_PREVIOUS_SHA: previousSha,
  });

  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Deploy-relevant change detected: next\.config\.mjs/);
});

test("vercel.json delegates ignored-build decisions and disables all non-checkpoint branch auto deploys", async () => {
  const config = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  ) as {
    ignoreCommand?: string;
    git?: { deploymentEnabled?: Record<string, boolean> };
  };

  assert.equal(config.ignoreCommand, "bash scripts/vercel-ignore-build.sh");
  const rules = config.git?.deploymentEnabled;
  assert.ok(rules);
  assert.equal(rules["*"], false);
  assert.equal(rules["**"], false);
  assert.equal(rules.master, true);
  assert.equal(rules["vercel-preview-*"], true);
});
