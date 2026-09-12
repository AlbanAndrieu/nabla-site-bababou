import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const performanceBudgetUrl = new URL("../scripts/ci-performance-budget.sh", import.meta.url);
const retiredBuildWrapperUrl = new URL(
  "../scripts/run-next-build.mjs",
  import.meta.url,
);

test("quality CI records performance around the single canonical Next build", async () => {
  const [workflow, packageJsonSource, performanceBudget] = await Promise.all([
    readFile(ciWorkflowUrl, "utf8"),
    readFile(packageJsonUrl, "utf8"),
    readFile(performanceBudgetUrl, "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource) as {
    scripts: Record<string, string>;
  };

  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(
    packageJson.scripts.check,
    "npm run check:prebuild && npm run build && npm run check:postbuild",
  );
  assert.match(packageJson.scripts["check:prebuild"], /npm run privacy:check$/);
  assert.equal(
    packageJson.scripts["check:postbuild"],
    "npm run privacy:check:build",
  );
  await assert.rejects(access(retiredBuildWrapperUrl));

  assert.match(workflow, /id: install/);
  assert.match(workflow, /- name: Restore npm downloads/);
  assert.match(workflow, /id: npm-cache/);
  assert.ok(
    workflow.includes(
      "actions/cache/restore@caa296126883cff596d87d8935842f9db880ef25",
    ),
  );
  assert.ok(
    workflow.includes(
      "actions/cache/save@caa296126883cff596d87d8935842f9db880ef25",
    ),
  );
  assert.match(workflow, /continue-on-error: true/);
  assert.doesNotMatch(
    workflow,
    /uses: actions\/cache(?:\/(?:restore|save))?@v5/,
  );
  assert.match(workflow, /path: ~\/\.npm/);
  assert.match(
    workflow,
    /npm-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}/,
  );
  assert.doesNotMatch(workflow, /cache: npm/);
  assert.match(workflow, /cd "\$\{RUNNER_TEMP\}"/);
  assert.match(
    workflow,
    /npm install --global npm@11\.19\.1 --no-audit --no-fund/,
  );

  assert.match(workflow, /id: checks/);
  assert.match(workflow, /npm run check:prebuild/);
  assert.match(workflow, /npm run check:postbuild/);
  assert.equal(workflow.match(/npm run build/g)?.length, 1);
  assert.match(workflow, /date \+%s%3N/);
  assert.match(workflow, /next_build_seconds/);

  assert.match(workflow, /Publish CI performance summary/);
  assert.match(workflow, /npm_cache_mb/);
  assert.match(workflow, /steps\.npm-cache\.outputs\.cache-hit/);
  assert.match(workflow, /npm cache hit/);
  assert.match(workflow, /node_modules_mb/);
  assert.match(workflow, /next_mb/);
  assert.match(workflow, /NEXT_BUILD_SECONDS/);
  assert.match(workflow, /NPM_CACHE_MB: \$\{\{ steps\.install\.outputs\.npm_cache_mb \}\}/);
  assert.match(workflow, /NPM_CACHE_HIT: \$\{\{ steps\.npm-cache\.outputs\.cache-hit \}\}/);
  assert.match(workflow, /MAINTENANCE_CHECK_SECONDS: \$\{\{ steps\.maintenance-checks\.outputs\.seconds \}\}/);
  assert.match(workflow, /NEXT_CACHE_HIT: \$\{\{ steps\.next-cache\.outputs\.cache-hit \}\}/);
  assert.match(workflow, /path: \.next\/cache/);
  assert.match(performanceBudget, /CI_PERF_BASELINE schema=3/);
  for (const field of ["npm_cache_mb", "npm_cache_hit", "maintenance_checks_s", "next_cache_hit"]) {
    assert.ok(performanceBudget.includes(`${field}=`), `${field} must be machine-readable`);
  }
});
