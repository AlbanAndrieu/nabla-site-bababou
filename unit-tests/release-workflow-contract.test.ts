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
  assert.match(workflow, /VALIDATED_SHA=/);
  assert.match(workflow, /git rev-parse origin\/master/);
  assert.match(workflow, /current=false/);
  assert.match(workflow, /steps\.freshness\.outputs\.current == 'true'/);
});

test("semantic release keeps GitHub credentials available for the authenticated push", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /persist-credentials: false/);

  const semanticRelease = section(
    workflow,
    "- name: Run semantic-release",
    "- name: Verify numeric release state",
  );
  assert.match(semanticRelease, /GITHUB_TOKEN:/);
  assert.match(semanticRelease, /GH_TOKEN:/);
  assert.match(semanticRelease, /gh auth setup-git/);
  assert.match(semanticRelease, /npm exec --yes --ignore-scripts/);
  assert.match(semanticRelease, /--package=semantic-release@25\.0\.8/);
  assert.match(semanticRelease, /--package=@semantic-release\/changelog@7\.0\.0/);
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
