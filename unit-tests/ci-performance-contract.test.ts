import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const packageJsonUrl = new URL("../package.json", import.meta.url);
const retiredBuildWrapperUrl = new URL(
  "../scripts/run-next-build.mjs",
  import.meta.url,
);

test("quality CI records performance around the single canonical Next build", async () => {
  const [workflow, packageJsonSource] = await Promise.all([
    readFile(ciWorkflowUrl, "utf8"),
    readFile(packageJsonUrl, "utf8"),
  ]);
  const packageJson = JSON.parse(packageJsonSource) as {
    scripts: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts.build,
    "bash scripts/run-next-clean.sh build",
  );
  assert.equal(packageJson.scripts.start, "next start");
  assert.equal(
    packageJson.scripts.check,
    "npm run check:prebuild && npm run build && npm run check:postbuild",
  );
  assert.match(
    packageJson.scripts["check:prebuild"],
    /npm run privacy:check && npm run privacy:publication$/,
  );
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
  assert.match(workflow, /- name: Install pinned npm from Mise/);
  assert.match(
    workflow,
    /jdx\/mise-action@08ae2a091c038e1e05ec6f5115dc5c69d5a2a6b8/,
  );
  assert.match(workflow, /install_args: npm/);
  assert.match(workflow, /run: test "\$\(npm --version\)" = "11\.17\.0"/);
  assert.doesNotMatch(workflow, /npm install --global npm@/);

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
  assert.match(workflow, /NEXT_CACHE_HIT/);
  assert.match(workflow, /path: \.next\/cache/);
});
