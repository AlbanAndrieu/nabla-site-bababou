import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const nextBuildRunnerUrl = new URL(
  "../scripts/run-next-build.mjs",
  import.meta.url,
);

test("quality CI records performance without running a second Next build", async () => {
  const [workflow, packageJsonSource, nextBuildRunner] = await Promise.all([
    readFile(ciWorkflowUrl, "utf8"),
    readFile(packageJsonUrl, "utf8"),
    readFile(nextBuildRunnerUrl, "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource) as {
    scripts: Record<string, string>;
  };

  assert.equal(packageJson.scripts.build, "node scripts/run-next-build.mjs");
  assert.match(nextBuildRunner, /node_modules\/next\/dist\/bin\/next/);
  assert.match(nextBuildRunner, /next_build_seconds/);
  assert.match(nextBuildRunner, /GITHUB_OUTPUT/);

  assert.match(workflow, /id: install/);
  assert.match(workflow, /- name: Restore npm downloads/);
  assert.match(workflow, /id: npm-cache/);
  assert.match(workflow, /actions\\/cache\\/restore@caa296126883cff596d87d8935842f9db880ef25/);
  assert.match(workflow, /actions\\/cache\\/save@caa296126883cff596d87d8935842f9db880ef25/);
  assert.match(workflow, /continue-on-error: true/);
  assert.doesNotMatch(workflow, /uses: actions\/cache(?:\/(?:restore|save))?@v5/);
  assert.match(workflow, /path: ~\/\.npm/);
  assert.match(
    workflow,
    /npm-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/,
  );
  assert.doesNotMatch(workflow, /cache: npm/);
  assert.match(workflow, /cd "\$\{RUNNER_TEMP\}"/);
  assert.match(
    workflow,
    /npm install --global npm@11\.17\.0 --no-audit --no-fund/,
  );
  assert.match(workflow, /id: checks/);
  assert.match(workflow, /Publish CI performance summary/);
  assert.match(workflow, /npm_cache_mb/);
  assert.match(workflow, /steps\.npm-cache\.outputs\.cache-hit/);
  assert.match(workflow, /npm cache hit/);
  assert.match(workflow, /node_modules_mb/);
  assert.match(workflow, /next_mb/);
  assert.match(workflow, /NEXT_BUILD_SECONDS/);
  assert.match(workflow, /NEXT_CACHE_HIT/);
  assert.match(workflow, /path: \.next\/cache/);

  assert.equal(workflow.match(/npm run check/g)?.length, 2);
  assert.doesNotMatch(workflow, /npm run build/);
});
