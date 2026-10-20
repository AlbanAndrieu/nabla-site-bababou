import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function section(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  assert.notEqual(startIndex, -1, `Missing workflow section: ${start}`);
  assert.notEqual(endIndex, -1, `Missing workflow section: ${end}`);

  return source.slice(startIndex, endIndex);
}

test("semantic release runs only after validated master CI or manual dispatch", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  const ci = await readFile(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /CI \(Quality and Security\)/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.head_branch == 'master'/);
  assert.doesNotMatch(workflow, /^\s*push:\s*$/m);

  assert.match(ci, /push:/);
  assert.match(ci, /branches:\s*\n\s*- master/);
});

test("semantic release refuses stale validated revisions", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /Verify validated revision is still current master/);
  assert.match(
    workflow,
    /VALIDATED_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/,
  );
  assert.match(workflow, /git rev-parse origin\/master/);
  assert.match(workflow, /current=false/);
  assert.match(workflow, /steps\.freshness\.outputs\.current == 'true'/);
});

test("semantic release authenticates before refreshing current master", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /persist-credentials: false/);

  const authentication = section(
    workflow,
    "- name: Configure release Git authentication",
    "- name: Verify validated revision is still current master",
  );
  const freshness = section(
    workflow,
    "- name: Verify validated revision is still current master",
    "- name: Set up Node.js",
  );

  assert.match(authentication, /GH_TOKEN:/);
  assert.match(authentication, /gh auth setup-git/);
  assert.match(freshness, /GH_TOKEN:/);
  assert.match(freshness, /git fetch --force origin master:/);
  assert.ok(
    workflow.indexOf("- name: Configure release Git authentication") <
      workflow.indexOf(
        "- name: Verify validated revision is still current master",
      ),
  );
});

test("semantic release avoids installing the application dependency graph", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  const nodeSetup = section(
    workflow,
    "- name: Set up Node.js",
    "- name: Install pinned npm from Mise",
  );
  assert.match(nodeSetup, /steps\.freshness\.outputs\.current == 'true'/);
  assert.match(nodeSetup, /node-version-file: "\.nvmrc"/);
  assert.doesNotMatch(nodeSetup, /cache: npm/);
  const npmPin = section(
    workflow,
    "- name: Install pinned npm from Mise",
    "- name: Run semantic-release",
  );
  assert.match(
    npmPin,
    /jdx\/mise-action@08ae2a091c038e1e05ec6f5115dc5c69d5a2a6b8/,
  );
  assert.match(npmPin, /install_args: npm/);
  assert.match(npmPin, /Verify npm toolchain/);
  assert.doesNotMatch(npmPin, /npm install --global/);
  assert.doesNotMatch(workflow, /Install application dependencies/);
  assert.doesNotMatch(workflow, /npm ci/);

  const semanticRelease = section(
    workflow,
    "- name: Run semantic-release",
    "- name: Verify numeric release state",
  );
  assert.match(semanticRelease, /GITHUB_TOKEN:/);
  assert.match(semanticRelease, /GH_TOKEN:/);
  assert.match(semanticRelease, /git config --local user\.name/);
  assert.match(semanticRelease, /git config --local user\.email/);
  assert.match(semanticRelease, /npm exec --yes --ignore-scripts/);
  assert.match(semanticRelease, /--package=semantic-release@25\.0\.8/);
  assert.match(
    semanticRelease,
    /--package=@semantic-release\/changelog@7\.0\.0/,
  );
  assert.match(semanticRelease, /--package=@semantic-release\/git@11\.0\.1/);
  assert.match(semanticRelease, /--package=@semantic-release\/github@12\.0\.9/);
  assert.doesNotMatch(semanticRelease, /npm run semantic-release/);
});

test("semantic release preserves Bababou's established numeric release history", async () => {
  const config = await readFile(
    new URL("../.releaserc.yaml", import.meta.url),
    "utf8",
  );
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(config, /tagFormat: "\$\{version\}"/);
  assert.doesNotMatch(workflow, /git tag v0\.0\.0/);
  assert.doesNotMatch(workflow, /Bootstrap semantic-release baseline/);
  assert.match(workflow, /LATEST_TAG=/);
  assert.match(workflow, /PACKAGE_VERSION=/);
  assert.match(workflow, /gh release view "\$LATEST_TAG"/);
});

test("release token remains least-privileged", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(workflow, /permission-workflows:/);
  assert.doesNotMatch(workflow, /^\s*workflows:\s*write\s*$/m);
  assert.match(workflow, /^\s*contents:\s*write\s*$/m);
});

test("release tooling stays out of the normal application install", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
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

test("semantic release requires dedicated GitHub App credentials and never falls back to GITHUB_TOKEN", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /branches:\s*\n\s*- master/);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /^\s*contents: write\s*$/m);
  assert.match(workflow, /name: Resolve release credential policy/);
  assert.match(workflow, /RELEASE_APP_PRIVATE_KEY_CONFIGURED:/);
  assert.match(workflow, /secrets\.RELEASE_APP_PRIVATE_KEY != ''/);
  assert.match(workflow, /name: Report skipped semantic release/);
  assert.match(workflow, /steps\.release_credentials\.outputs\.enabled != 'true'/);
  assert.match(workflow, /if: steps\.release_credentials\.outputs\.enabled == 'true'/);
  assert.match(workflow, /GH_TOKEN: \$\{\{ steps\.release_app_token\.outputs\.token \}\}/);
  assert.match(workflow, /GITHUB_TOKEN: \$\{\{ steps\.release_app_token\.outputs\.token \}\}/);
  assert.doesNotMatch(workflow, /\|\| secrets\.GITHUB_TOKEN/);
  assert.doesNotMatch(workflow, /\$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(workflow, /Verify validated revision is still current master/);
  assert.match(workflow, /bash scripts\/verify-mise-npm\.sh/);
});
