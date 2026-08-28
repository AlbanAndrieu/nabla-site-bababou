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

test("semantic release keeps GitHub credentials available for every git push", async () => {
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
  assert.match(semanticRelease, /npm run semantic-release/);
});

test("semantic release uses the established numeric release history", async () => {
  const config = await readFile(
    new URL("../.releaserc.yaml", import.meta.url),
    "utf8",
  );
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(config, /tagFormat: "\$\{version\}"/);
  assert.doesNotMatch(workflow, /git tag 0\.0\.0/);
  assert.doesNotMatch(workflow, /refs\/tags\/0\.0\.1/);
  assert.match(workflow, /LATEST_TAG=/);
  assert.match(workflow, /PACKAGE_VERSION=/);
  assert.match(workflow, /gh release view "\$\{LATEST_TAG\}"/);
});

test("GitHub releases do not comment on or label historical pull requests", async () => {
  const config = await readFile(
    new URL("../.releaserc.yaml", import.meta.url),
    "utf8",
  );

  assert.match(config, /successComment: false/);
  assert.match(config, /releasedLabels: false/);
});

test("quality CI runs when release automation changes", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /"\.github\/workflows\/release\.yml"/);
  assert.match(workflow, /"\.releaserc\.yaml"/);
  assert.match(workflow, /"CHANGELOG\.md"/);
});
