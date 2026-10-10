import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ciScopeScript = fileURLToPath(
  new URL("../scripts/ci-scope.sh", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function createRepository(prefix: string) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  git(directory, "init", "--quiet");
  git(directory, "config", "user.name", "CI Scope Test");
  git(directory, "config", "user.email", "ci-scope@example.invalid");
  await writeFile(join(directory, "README.md"), "base\n");
  git(directory, "add", "README.md");
  git(directory, "commit", "--quiet", "-m", "base");
  return { directory, baseSha: git(directory, "rev-parse", "HEAD") };
}

function classify(directory: string, baseSha: string, headSha = "HEAD") {
  return spawnSync("bash", [ciScopeScript, baseSha, headSha], {
    cwd: directory,
    encoding: "utf8",
    env: process.env,
  });
}

function classifyWorktree(directory: string, baseSha: string) {
  return classify(directory, baseSha, "WORKTREE");
}

function expectScope(
  stdout: string,
  expected: {
    maintenance: boolean;
    application: boolean;
    sast: boolean;
    build: boolean;
    preview: boolean;
    zap?: boolean;
    dependencies?: boolean;
    count?: number;
  },
) {
  const values = {
    maintenance_only: expected.maintenance,
    application: expected.application,
    sast: expected.sast,
    build: expected.build,
    preview_required: expected.preview,
    zap_bootstrap: expected.zap ?? false,
    dependencies: expected.dependencies ?? false,
    changed_count: expected.count ?? 1,
  };

  for (const [name, value] of Object.entries(values)) {
    assert.match(stdout, new RegExp("^" + name + "=" + value + "$", "m"));
  }
}

test("quality orchestration remains maintenance-only", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-maint-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "scripts"), { recursive: true });
  await writeFile(join(directory, "scripts", "agent-publish.sh"), "#!/bin/sh\n");
  await writeFile(join(directory, "scripts", "agent-p0-check.sh"), "#!/bin/sh\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "maintenance");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
    count: 2,
  });
});

test("offline agent shell changes remain maintenance-only without false Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-offline-scope-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "scripts"), { recursive: true });
  await writeFile(join(directory, "scripts", "agent-offline-check.sh"), "true\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "offline maintenance");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
});

test("workflow YAML keeps SAST but skips application build and Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-workflow-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(join(directory, ".github", "workflows", "ci.yml"), "name: CI\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "workflow");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: true,
    build: false,
    preview: false,
  });
});

test("ZAP workflow exposes bootstrap without allocating Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-zap-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(directory, ".github", "workflows", "zap-preview.yml"),
    "name: ZAP Preview\n",
  );
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "zap workflow");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: true,
    build: false,
    preview: false,
    zap: true,
  });
});

test("runtime source requires application build, SAST and Preview", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-runtime-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(join(directory, "app", "page.tsx"), "export default function Page() {}\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "runtime");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
  });
});

test("deleted runtime source still requires application build, SAST and Preview", async (t) => {
  const { directory } = await createRepository("bababou-ci-delete-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(join(directory, "app", "runtime.ts"), "export const runtime = true;\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "runtime base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  git(directory, "rm", "--quiet", "app/runtime.ts");
  git(directory, "commit", "--quiet", "-m", "delete runtime");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
  });
});

test("dependency changes keep Snyk but avoid fake Semgrep work", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-deps-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "package.json"), '{"name":"fixture"}\n');
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "dependencies");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: false,
    build: true,
    preview: true,
    dependencies: true,
  });
});

test("unknown deploy configuration fails safe without fake Semgrep work", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-config-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "vercel.json"), "{}\n");
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "deployment config");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: false,
    build: true,
    preview: true,
  });
});

test("baseline classifier is policy-only and Preview-safe", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-classifier-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "scripts", "lib"), { recursive: true });
  await writeFile(
    join(directory, "scripts", "lib", "production-baseline-classification.sh"),
    "# policy-only change\n",
  );
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "baseline policy");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
});

test("runtime plus ZAP workflow requires Preview and exposes bootstrap", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-runtime-zap-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "app"), { recursive: true });
  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(join(directory, "app", "page.tsx"), "export default function Page() {}\n");
  await writeFile(
    join(directory, ".github", "workflows", "zap-preview.yml"),
    "name: ZAP Preview\n",
  );
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "runtime and zap");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
    zap: true,
    count: 2,
  });
});

test("empty diffs fail safe", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-empty-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  git(directory, "commit", "--quiet", "--allow-empty", "-m", "empty");

  const result = classify(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
    count: 0,
  });
});

test("WORKTREE mode classifies untracked maintenance and runtime paths before commit", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "docs"), { recursive: true });
  await writeFile(join(directory, "docs", "notes.md"), "local roadmap note\n");

  const maintenance = classifyWorktree(directory, baseSha);
  assert.equal(maintenance.status, 0, maintenance.stderr);
  expectScope(maintenance.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
  assert.match(maintenance.stdout, /Scope source: committed \+ staged \+ unstaged \+ untracked/);

  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(
    join(directory, "app", "page.tsx"),
    "export default function Page() { return null; }\n",
  );

  const runtime = classifyWorktree(directory, baseSha);
  assert.equal(runtime.status, 0, runtime.stderr);
  expectScope(runtime.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
    count: 2,
  });
});

test("WORKTREE mode sees staged runtime deletions", async (t) => {
  const { directory } = await createRepository("bababou-ci-worktree-delete-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, "app"), { recursive: true });
  await writeFile(
    join(directory, "app", "runtime.ts"),
    "export const runtime = true;\n",
  );
  git(directory, "add", ".");
  git(directory, "commit", "--quiet", "-m", "runtime base");
  const baseSha = git(directory, "rev-parse", "HEAD");

  git(directory, "rm", "--quiet", "app/runtime.ts");

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
  });
});

test("WORKTREE mode exposes dependency cost before package changes are committed", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-deps-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "package.json"), '{"name":"fixture"}\n');

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: false,
    build: true,
    preview: true,
    dependencies: true,
  });
});

test("WORKTREE mode keeps workflow-only changes Preview-free but security-sensitive", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-workflow-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(directory, ".github", "workflows", "quality.yml"),
    "name: Quality\n",
  );

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: true,
    build: false,
    preview: false,
  });
});

test("WORKTREE mode exposes ZAP bootstrap without forcing Preview alone", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-zap-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(directory, ".github", "workflows", "zap-preview.yml"),
    "name: ZAP Preview\n",
  );

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: false,
    sast: true,
    build: false,
    preview: false,
    zap: true,
  });
});

test("WORKTREE mode fails safe on unknown deploy configuration before commit", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-config-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(join(directory, "vercel.json"), "{}\n");

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: false,
    build: true,
    preview: true,
  });
});

test("WORKTREE mode keeps empty diffs fail-safe", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-empty-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: false,
    application: true,
    sast: true,
    build: true,
    preview: true,
    count: 0,
  });
});

test("WORKTREE mode keeps OpenCode agent configuration maintenance-only", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-opencode-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(
    join(directory, "opencode.json"),
    '{"$schema":"https://opencode.ai/config.json"}\n',
  );

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
});

test("WORKTREE mode keeps OpenCode agent prompts maintenance-only", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-opencode-agent-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await mkdir(join(directory, ".opencode", "agents"), { recursive: true });
  await writeFile(
    join(directory, ".opencode", "agents", "bababou.md"),
    "---\nmode: primary\n---\n",
  );

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
});

test("WORKTREE mode keeps Renovate policy maintenance-only", async (t) => {
  const { directory, baseSha } = await createRepository("bababou-ci-worktree-renovate-");
  t.after(async () => rm(directory, { recursive: true, force: true }));

  await writeFile(
    join(directory, "renovate.json"),
    '{"extends":["config:recommended"]}\n',
  );

  const result = classifyWorktree(directory, baseSha);
  assert.equal(result.status, 0, result.stderr);
  expectScope(result.stdout, {
    maintenance: true,
    application: false,
    sast: false,
    build: false,
    preview: false,
  });
});
