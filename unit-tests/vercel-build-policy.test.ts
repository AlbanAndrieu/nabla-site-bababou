import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

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

function runPolicy(directory: string) {
  return spawnSync("bash", [policyScript], {
    cwd: directory,
    encoding: "utf8",
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

test("Vercel still skips documentation-only commits", async (t) => {
  const directory = await createRepo("docs: refresh roadmap", "docs/roadmap.md");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = runPolicy(directory);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Only documentation\/repository maintenance changed/);
});

test("vercel.json delegates ignored-build decisions to the shared policy", async () => {
  const config = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  ) as { ignoreCommand?: string };

  assert.equal(config.ignoreCommand, "bash scripts/vercel-ignore-build.sh");
});
