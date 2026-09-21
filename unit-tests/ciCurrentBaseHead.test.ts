import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("PR CI resolves current base and production heads instead of trusting event-time base SHA", async () => {
  const ci = await read(".github/workflows/ci.yml");

  assert.doesNotMatch(
    ci,
    /github\.event\.pull_request\.base\.sha/,
    "PR CI must not use the event-time base SHA after master can advance",
  );
  assert.match(ci, /id: current-heads/);
  assert.match(ci, /const baseRef = context\.payload\.pull_request\.base\.ref;/);
  assert.match(ci, /branch: baseRef/);
  assert.match(ci, /core\.setOutput\('base-sha', baseSha\)/);
  assert.match(ci, /const productionRef = context\.payload\.repository\.default_branch;/);
  assert.match(ci, /branch: productionRef/);
  assert.match(ci, /core\.setOutput\('production-sha', productionSha\)/);
  assert.match(ci, /current-base-sha: \$\{\{ steps\.current-heads\.outputs\.base-sha \}\}/);

  const currentBaseUsages = ci.match(/steps\.current-heads\.outputs\.base-sha/g) ?? [];
  assert.ok(currentBaseUsages.length >= 4);
  assert.match(
    ci,
    /BASE_SHA: \$\{\{ steps\.current-heads\.outputs\.production-sha \}\}/,
  );
  assert.match(
    ci,
    /PR_BASE_SHA: \$\{\{ needs\.quality\.outputs\.current-base-sha \}\}/,
  );
});
