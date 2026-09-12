import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared agent tooling follows the Node 24 LTS root-runtime contract", async () => {
  const [setup, vscode, cursor, nextjs] = await Promise.all([
    read(".github/workflows/copilot-setup-steps.yml"),
    read(".vscode/copilot-instructions.md"),
    read(".cursor/rules/130_version-control_git.mdc"),
    read(".github/copilot-instructions-nextjs.md"),
  ]);

  assert.match(setup, /node-version-file:\s*"\.nvmrc"/);
  assert.doesNotMatch(setup, /node-version:\s*"?(?:24|25\.9\.0)"?/);
  assert.match(setup, /- name: Restore npm downloads/);
  assert.ok(setup.includes("actions/cache/restore@caa296126883cff596d87d8935842f9db880ef25"));
  assert.ok(setup.includes("actions/cache/save@caa296126883cff596d87d8935842f9db880ef25"));
  assert.match(setup, /pre-commit install-hooks/);
  assert.doesNotMatch(setup, /uses: actions\/cache(?:\/(?:restore|save))?@v5/);
  assert.match(setup, /cd "\$\{RUNNER_TEMP\}"/);
  assert.match(setup, /npm ci --no-audit --no-fund/);

  for (const adapter of [vscode, cursor, nextjs]) {
    assert.match(adapter, /AGENTS\.md/);
  }

  assert.doesNotMatch(vscode, /vercel deploy|vercel --prod/);
  assert.doesNotMatch(vscode, /Apache v2/);
  assert.doesNotMatch(vscode, /sitemap-albandrieu-com\.xml/);
  assert.doesNotMatch(cursor, /branch from and merge to develop/);
  assert.doesNotMatch(cursor, /feature\/new-feature develop/);
});


test("GitHub Node workflows share .nvmrc as their source of truth", async () => {
  const [nvmrc, quality, playwright, copilot, release] = await Promise.all([
    read(".nvmrc"),
    read(".github/workflows/ci.yml"),
    read(".github/workflows/playwright.yml"),
    read(".github/workflows/copilot-setup-steps.yml"),
    read(".github/workflows/release.yml"),
  ]);

  assert.equal(nvmrc.trim(), "v24.21.0");

  for (const workflow of [quality, playwright, copilot, release]) {
    assert.match(workflow, /node-version-file:\s*"\.nvmrc"/);
    assert.doesNotMatch(workflow, /node-version:\s*"?25\.9\.0"?/);
  }

  assert.match(quality, /\.github\/workflows\/copilot-setup-steps\.yml/);
  assert.match(quality, /\.github\/workflows\/docker-build\.yml/);
});

test("specialized agent adapters do not restore retired deployment or hook paths", async () => {
  const [staticSite, api, python] = await Promise.all([
    read(".github/copilot-instructions-static-site.md"),
    read(".github/copilot-instructions-api.md"),
    read(".github/copilot-instructions-python.md"),
  ]);

  for (const adapter of [staticSite, api, python]) {
    assert.match(adapter, /AGENTS\.md/);
  }

  assert.doesNotMatch(staticSite, /vercel deploy|vercel --prod/);
  assert.match(api, /local Vercel CLI dependency/);
  assert.match(python, /mise run hooks/);
});

test("OpenCommit remains installed as dev-only commit tooling", async () => {
  const packageJson = JSON.parse(await read("package.json")) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  assert.ok(packageJson.devDependencies?.opencommit);
  assert.equal(packageJson.scripts?.oco, "node scripts/run-opencommit.mjs");
});

test("release-only tooling is not installed during normal development", async () => {
  const packageJson = JSON.parse(await read("package.json")) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  for (const name of [
    "semantic-release",
    "@semantic-release/changelog",
    "@semantic-release/git",
    "@semantic-release/github",
  ]) {
    assert.equal(packageJson.devDependencies?.[name], undefined);
  }
  assert.equal(packageJson.scripts?.["semantic-release"], undefined);
});

test("public/contributor guidance does not restore the retired standalone-static architecture", async () => {
  const [publicReadme, contributing, cursor, precommit] = await Promise.all([
    read("public/README.md"),
    read("CONTRIBUTING.md"),
    read(".cursor/rules/001_project-description.mdc"),
    read(".pre-commit-config.yaml"),
  ]);

  assert.match(publicReadme, /repository-root \*\*Next\.js\*\* application/);
  assert.match(publicReadme, /not.*separate deployment target/i);
  assert.doesNotMatch(publicReadme, /static site root|my-app\//);

  assert.match(contributing, /MIT License/);
  assert.match(contributing, /mise run hooks/);
  assert.match(contributing, /npm run oco/);
  assert.doesNotMatch(contributing, /Apache License 2\.0|my-app\//);

  assert.doesNotMatch(cursor, /Static site root \(served as web root\)/);
  assert.doesNotMatch(precommit, /my-app\//);
});

test("security guidance reflects the current dependency and deployment boundary", async () => {
  const [security, packageRaw, nvmrc] = await Promise.all([
    read("SECURITY.md"),
    read("package.json"),
    read(".nvmrc"),
  ]);
  const packageJson = JSON.parse(packageRaw) as {
    engines?: { node?: string; npm?: string };
  };

  assert.match(security, /strict-allow-scripts=true/);
  assert.match(security, /Vercel Git Integration/);
  assert.match(security, /privacy gate/);
  assert.ok(packageJson.engines?.node);
  assert.ok(packageJson.engines?.npm);
  assert.ok(security.includes(`\`${packageJson.engines.node}\``));
  assert.ok(security.includes(`\`${packageJson.engines.npm}\``));
  assert.ok(security.includes(`\`${nvmrc.trim()}\``));
  assert.match(security, /Vercel production uses its supported Node 24\.x runtime/);
  assert.match(security, /maintenance-only changes intentionally skip Semgrep, the production Next build and dependency scanning/);
  assert.match(security, /Snyk runs only for dependency-scope Quality changes when `SNYK_TOKEN` is configured/);
  assert.match(security, /Pre-merge Quality requires a healthy production base/);
  assert.match(security, /Production Post-deploy Smoke/);
  assert.match(security, /Production DAST/);
  assert.match(security, /metadata-only semantic-release commit may inherit its parent production baseline/);
  assert.doesNotMatch(security, />=24\.11\.0 <25/);
  assert.doesNotMatch(security, /first post-merge production DAST\/smoke statuses must be observed/);
  assert.doesNotMatch(security, /Initial State:|Final State:|remaining vulnerabilities are in deployment tooling/);
});
