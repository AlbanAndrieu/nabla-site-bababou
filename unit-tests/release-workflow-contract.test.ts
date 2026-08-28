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

  const bootstrap = section(
    workflow,
    "- name: Bootstrap semantic version baseline",
    "- name: Run semantic-release",
  );
  assert.match(bootstrap, /GH_TOKEN:/);
  assert.match(bootstrap, /gh auth setup-git/);
  assert.match(bootstrap, /git push origin refs\/tags\/0\.0\.0/);

  const semanticRelease = section(
    workflow,
    "- name: Run semantic-release",
    "- name: Verify initial 0.0.1 release",
  );
  assert.match(semanticRelease, /GITHUB_TOKEN:/);
  assert.match(semanticRelease, /GH_TOKEN:/);
  assert.match(semanticRelease, /gh auth setup-git/);
  assert.match(semanticRelease, /npm run semantic-release/);
});

test("semantic release keeps the requested numeric 0.0.x tag history", async () => {
  const config = await readFile(
    new URL("../.releaserc.yaml", import.meta.url),
    "utf8",
  );
  const workflow = await readFile(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );

  assert.match(config, /tagFormat: "\$\{version\}"/);
  assert.match(workflow, /git tag 0\.0\.0/);
  assert.match(workflow, /refs\/tags\/0\.0\.1/);
  assert.match(workflow, /gh release view 0\.0\.1/);
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
