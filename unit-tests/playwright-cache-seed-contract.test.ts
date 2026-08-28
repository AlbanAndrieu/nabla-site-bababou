import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const previewWorkflowUrl = new URL(
  "../.github/workflows/playwright.yml",
  import.meta.url,
);
const cacheWorkflowUrl = new URL(
  "../.github/workflows/playwright-cache.yml",
  import.meta.url,
);
const ciWorkflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

const cacheKeyPattern =
  /playwright-chromium-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-\$\{\{ steps\.playwright-version\.outputs\.version \}\}/;

test("default branch seeds the same Chromium cache consumed by Preview E2E", async () => {
  const [previewWorkflow, cacheWorkflow] = await Promise.all([
    readFile(previewWorkflowUrl, "utf8"),
    readFile(cacheWorkflowUrl, "utf8"),
  ]);

  assert.match(previewWorkflow, cacheKeyPattern);
  assert.match(cacheWorkflow, cacheKeyPattern);
  assert.match(cacheWorkflow, /branches:\s*\n\s*- master/);
  assert.match(cacheWorkflow, /package-lock\.json/);
  assert.match(cacheWorkflow, /node_modules\/@playwright\/test/);
  assert.match(
    cacheWorkflow,
    /steps\.playwright-cache\.outputs\.cache-hit != 'true'/,
  );
});

test("cache seeding avoids a full project install", async () => {
  const cacheWorkflow = await readFile(cacheWorkflowUrl, "utf8");

  assert.doesNotMatch(cacheWorkflow, /npm ci/);
  assert.match(
    cacheWorkflow,
    /npm exec --yes --package="playwright@\$\{PLAYWRIGHT_VERSION\}" -- playwright install chromium/,
  );
  assert.match(cacheWorkflow, /persist-credentials: false/);
});

test("quality CI validates changes to the cache seed workflow", async () => {
  const ciWorkflow = await readFile(ciWorkflowUrl, "utf8");

  assert.match(ciWorkflow, /\.github\/workflows\/playwright-cache\.yml/);
});
