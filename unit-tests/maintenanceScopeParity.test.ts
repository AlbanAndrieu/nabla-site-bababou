import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("maintenance paths stay aligned across CI scope, on-demand Preview and production baseline", async () => {
  const [scope, ci, onDemand, baseline] = await Promise.all([
    read("scripts/ci-scope.sh"),
    read(".github/workflows/ci.yml"),
    read(".github/workflows/vercel-preview.yml"),
    read("scripts/verify-production-baseline.sh"),
  ]);

  const sharedPaths = [
    "scripts/agent-quality-gate.sh",
    "scripts/agent-publish.sh",
    "scripts/lib/agent-quality-support.sh",
    "scripts/quality-gate.sh",
    "scripts/ci-scope.sh",
    "scripts/verify-production-baseline.sh",
    "scripts/verify-production-live.sh",
    "scripts/ci-performance-budget.sh",
    "scripts/publish-vercel-preview-checkpoint.sh",
    "scripts/check_code_size.py",
    "scripts/eslint-github-formatter.mjs",
  ];

  for (const path of sharedPaths) {
    assert.ok(scope.includes(path), `${path} missing from CI scope`);
    assert.ok(onDemand.includes(`filename === '${path}'`), `${path} missing from on-demand Preview scope`);
    assert.ok(baseline.includes(path), `${path} missing from production-baseline scope`);
  }

  assert.match(ci, /needs\.quality\.outputs\.preview_required == 'true'/);
  assert.match(
    ci,
    /preview_required:\s*\$\{\{ steps\.ci-scope\.outputs\.preview_required \}\}/,
  );
  assert.doesNotMatch(ci, /const safeOnly/);
  assert.doesNotMatch(ci, /deployRelevant/);
  assert.doesNotMatch(ci, /github\.rest\.pulls\.listFiles/);

  assert.match(onDemand, /filename\.startsWith\('docs\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('unit-tests\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('tests\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('\.github\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('commitlint\.config\.'\)/);
  assert.match(onDemand, /filename\.startsWith\('playwright\.config\.'\)/);
  assert.doesNotMatch(onDemand, /forceCheckpoint/);
  assert.match(onDemand, /publish-vercel-preview-checkpoint\.sh/);
});

test("workflow changes are security-sensitive but non-deployable in canonical scope", async () => {
  const scope = await read("scripts/ci-scope.sh");
  const maintenanceStart = scope.indexOf("is_maintenance_only_path() {");
  const previewStart = scope.indexOf("is_preview_safe_path() {");

  assert.ok(maintenanceStart >= 0 && previewStart > maintenanceStart);
  const maintenance = scope.slice(maintenanceStart, previewStart);
  const preview = scope.slice(previewStart);

  assert.doesNotMatch(maintenance, /\.github\/\*/);
  assert.match(preview, /\.github\/\*/);
});
