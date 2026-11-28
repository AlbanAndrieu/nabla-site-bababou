import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { URL } from "node:url";

const load = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
const deep = load(".github/workflows/security-deep.yml");
const production = load(".github/workflows/production-dast.yml");
const preview = load(".github/workflows/zap-preview.yml");
const reviewedExclusions = load(".nuclei/ignore-templates.txt");

test("Bababou reuses the single master-only weekly Nuclei job (no duplicate schedules)", () => {
  assert.equal(deep.match(/^ {2}nuclei-public:/gm)?.length, 1);
  assert.match(deep, /if: github\.ref == 'refs\/heads\/master'/);
  assert.match(deep, /cron: "17 4 \* \* 1"/);
  assert.match(deep, /https:\/\/www\.bababou\.com/);
  assert.match(deep, /nuclei_3\.11\.1_linux_amd64\.zip/);
  assert.match(deep, /sha256sum --check --status/);
});

test("Nuclei bootstrap fails when updater creates an empty template directory", () => {
  assert.match(deep, /GITHUB_TOKEN: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(deep, /find "\$templates_dir" -type f/);
  assert.match(deep, /NUCLEI_TEMPLATES_UNAVAILABLE/);
  assert.match(deep, /-t "\$NUCLEI_TEMPLATE_DIR"/);
  assert.match(deep, /-rl 2 -c 1 -timeout 5 -retries 0/);
  assert.match(deep, /-pt http -ni -duc/);
  assert.match(deep, /-etags dos,fuzz,bruteforce,intrusive/);
  assert.match(deep, /-eid "\$joined"/);
  assert.match(deep, /done < \.nuclei\/ignore-templates\.txt/);
  assert.match(deep, /NUCLEI_EXCLUSION_INVALID/);
  assert.equal(
    reviewedExclusions
      .split(/\r?\n/)
      .filter((s) => s.trim() && !s.startsWith("#")).length,
    0,
    "No silent exclusions allowed by default",
  );
});

test("Nuclei cannot report PASS or upload raw results on WAF or scanner failures", () => {
  assert.match(deep, /NUCLEI_SCAN_INCOMPLETE/);
  assert.match(deep, /NUCLEI_COVERAGE_BLOCKED/);
  assert.match(deep, /INCOMPLETE \/ NOT_RUN/);
  assert.match(deep, /if: steps\.nuclei\.outcome == 'success'/);
  assert.match(deep, /Erase runner-local raw Nuclei evidence/);
  assert.match(deep, /nuclei-safe-report\.mjs/);
  assert.match(deep, /path: nuclei-master\.sarif/);
  assert.doesNotMatch(deep, /path:.*nuclei\.raw\.jsonl/);
  assert.match(deep, /retention-days: 3/);
});

test("ZAP Production derives HTML solely from minimized SARIF and retains the private collector path", () => {
  const producer = production.indexOf(
    "node scripts/security/zap-safe-report.mjs",
  );
  const renderer = production.indexOf(
    "node scripts/security/render-zap-safe-report.mjs",
  );
  const artifact = production.indexOf("name: zap-production-safe-");
  assert.ok(producer > 0 && renderer > producer && artifact > renderer);
  assert.match(production, /scripts\/security\/render-zap-safe-report\.mjs/);
  assert.match(production, /zap-production-safe\.sarif/);
  assert.match(production, /zap-production-safe\.html/);
  assert.match(production, /zap-production-summary\.md/);
  assert.match(production, /retention-days: 3/);
  assert.match(preview, /--hook=\/zap\/wrk\/rate-limit-hook\.py/);
  assert.match(production, /--hook=\/zap\/wrk\/rate-limit-hook\.py/);
  assert.doesNotMatch(production, /zaproxy\/action-baseline/);
});

test("ZAP Preview and Production disable Python hook bytecode in both Docker runs", () => {
  for (const workflow of [production, preview]) {
    assert.equal(
      (workflow.match(/--env PYTHONDONTWRITEBYTECODE=1/g) ?? []).length,
      2,
    );
    assert.match(workflow, /--hook=\/zap\/wrk\/rate-limit-hook\.py/);
    assert.match(workflow, /id: cleanup/);
    assert.match(
      workflow,
      /CLEANUP_OUTCOME: \$\{\{ steps\.cleanup\.outcome \}\}/,
    );
    assert.match(workflow, /private evidence cleanup failed/);
  }
});

test("Production commit status cannot be success after failed private cleanup", () => {
  assert.match(production, /steps\.cleanup\.outcome != 'success'/);
  const failureBranch = production.indexOf(
    'if [[ "$CLEANUP_OUTCOME" != "success" ]]',
  );
  const successBranch = production.indexOf("STATE=success", failureBranch);
  assert.ok(failureBranch > 0 && successBranch > failureBranch);
  assert.match(preview, /steps\.cleanup\.outcome != 'success'/);
});
