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

test("Playwright Preview runs reuse the Chromium browser cache", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  const cache = section(
    workflow,
    "- name: Cache Playwright Chromium",
    "- name: Install Playwright Chromium Browser",
  );
  const install = section(
    workflow,
    "- name: Install Playwright Chromium Browser",
    "- name: Install Chromium system dependencies",
  );

  assert.match(workflow, /id: playwright-version/);
  assert.match(workflow, /actions\/cache@v5/);
  assert.match(
    cache,
    /playwright-chromium-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ steps\.playwright-version\.outputs\.version \}\}/,
  );
  assert.doesNotMatch(cache, /github\.event_name != 'deployment_status'/);
  assert.match(install, /steps\.playwright-cache\.outputs\.cache-hit != 'true'/);
  assert.doesNotMatch(install, /github\.event_name == 'deployment_status'/);

  // System packages still need to be present on every fresh GitHub-hosted runner.
  assert.match(workflow, /npx playwright install-deps chromium/);
});

test("Playwright Preview helper actions run on the Node 24 generation", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/playwright.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /actions\/github-script@v8/);
  assert.doesNotMatch(workflow, /actions\/github-script@v7/);
  assert.match(workflow, /persist-credentials: false/);
});
