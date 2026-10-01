import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("maintenance paths stay aligned across canonical scope, on-demand Preview and production baseline", async () => {
  const [scope, ci, onDemand, baseline, baselineClassification] =
    await Promise.all([
      read("scripts/ci-scope.sh"),
      read(".github/workflows/ci.yml"),
      read(".github/workflows/vercel-preview.yml"),
      read("scripts/verify-production-baseline.sh"),
      read("scripts/lib/production-baseline-classification.sh"),
    ]);
  const productionBaselinePolicy = `${baseline}\n${baselineClassification}`;

  const sharedMaintenancePrefixes = [
    ["docs/*", "filename.startsWith('docs/')"],
    ["unit-tests/*", "filename.startsWith('unit-tests/')"],
  ] as const;

  for (const [shellPattern, jsPredicate] of sharedMaintenancePrefixes) {
    assert.ok(scope.includes(shellPattern), `${shellPattern} missing from CI scope`);
    assert.ok(
      onDemand.includes(jsPredicate),
      `${jsPredicate} missing from on-demand Preview scope`,
    );
    assert.ok(
      productionBaselinePolicy.includes(shellPattern),
      `${shellPattern} missing from production-baseline policy`,
    );
  }

  const sharedMaintenancePaths = [
    "scripts/agent-quality-gate.sh",
    "scripts/agent-p0-check.sh",
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

  for (const path of sharedMaintenancePaths) {
    assert.ok(scope.includes(path), `${path} missing from canonical CI scope`);
    assert.ok(
      onDemand.includes(`filename === '${path}'`),
      `${path} missing from on-demand Preview scope`,
    );
    assert.ok(
      productionBaselinePolicy.includes(path),
      `${path} missing from production-baseline policy`,
    );
  }

  assert.match(ci, /needs\.quality\.outputs\.preview_required == 'true'/);
  assert.match(
    ci,
    /preview_required:\s*\$\{\{ steps\.ci-scope\.outputs\.preview_required \}\}/,
  );
  assert.match(ci, /needs\.quality\.outputs\.zap_bootstrap/);
  assert.doesNotMatch(ci, /const safeOnly/);
  assert.doesNotMatch(ci, /deployRelevant/);
  assert.doesNotMatch(ci, /github\.rest\.pulls\.listFiles/);

  assert.match(onDemand, /filename\.startsWith\('docs\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('unit-tests\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('tests\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('\.github\/'\)/);
  assert.match(onDemand, /filename\.startsWith\('commitlint\.config\.'\)/);
  assert.match(onDemand, /filename\.startsWith\('playwright\.config\.'\)/);
  assert.match(onDemand, /publish-vercel-preview-checkpoint\.sh/);
  assert.doesNotMatch(onDemand, /git push --force origin/);
  assert.doesNotMatch(onDemand, /forceCheckpoint/);

  const classifierPath = "scripts/lib/production-baseline-classification.sh";
  assert.ok(
    baselineClassification.includes(classifierPath),
    "baseline classifier must accept its own policy-only maintenance hop",
  );

  const maintenanceStart = scope.indexOf("is_maintenance_only_path() {");
  const previewStart = scope.indexOf("is_preview_safe_path() {");
  const changedFilesStart = scope.indexOf("mapfile -t CHANGED_FILES");
  assert.ok(
    maintenanceStart >= 0 &&
      previewStart > maintenanceStart &&
      changedFilesStart > previewStart,
    "CI scope classifier functions must remain ordered and discoverable",
  );

  const maintenanceOnlyScope = scope.slice(maintenanceStart, previewStart);
  const previewSafeScope = scope.slice(previewStart, changedFilesStart);
  assert.ok(
    !maintenanceOnlyScope.includes(classifierPath),
    "baseline classifier changes must stay outside maintenance-only classification",
  );
  assert.ok(
    previewSafeScope.includes(classifierPath),
    "baseline classifier changes must remain Preview-safe",
  );
  assert.ok(
    onDemand.includes(`filename === '${classifierPath}'`),
    "baseline classifier changes must skip on-demand Preview",
  );
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
  assert.match(scope, /\.github\/workflows\/\*\.yml/);
  assert.match(scope, /\.github\/workflows\/\*\.yaml/);
  assert.match(scope, /is_source_file\(\)/);
});
