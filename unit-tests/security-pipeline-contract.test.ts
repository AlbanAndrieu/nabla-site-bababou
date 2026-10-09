import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const productionDastUrl = new URL(
  "../.github/workflows/production-dast.yml",
  import.meta.url,
);
const zapPreviewUrl = new URL(
  "../.github/workflows/zap-preview.yml",
  import.meta.url,
);
const zapRulesUrl = new URL("../.zap/rules.tsv", import.meta.url);

test("Quality runs changed-source Semgrep before the expensive Node build", async () => {
  const workflow = await readFile(ciUrl, "utf8");

  const semgrep = workflow.indexOf("Run Semgrep SAST on changed source");
  const setupNode = workflow.indexOf("Setup Node.js");
  assert.ok(semgrep > 0);
  assert.ok(setupNode > semgrep);
  assert.match(
    workflow,
    /python -m pip install --disable-pip-version-check --quiet 'semgrep==1\.145\.0'/,
  );
  assert.match(workflow, /SEMGREP_SEND_METRICS=off semgrep scan/);
  assert.doesNotMatch(workflow, /semgrep\/semgrep@sha256:/);
  assert.match(workflow, /--sarif/);
  assert.match(workflow, /semgrep-sast-report/);
  assert.match(workflow, /id: semgrep-sarif/);
  assert.match(workflow, /ENABLE_CODE_SCANNING_SARIF/);
  assert.match(workflow, /Report Code Scanning SARIF opt-in disabled/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /security-events: write/);
});

test("Quality retains Semgrep SARIF artifacts only for failed scans", async () => {
  const workflow = await readFile(ciUrl, "utf8");
  const preserveStart = workflow.indexOf(
    "- name: Preserve failed Semgrep SAST report",
  );
  const cleanStart = workflow.indexOf(
    "- name: Clean Semgrep SAST workspace",
    preserveStart,
  );
  const preserveBlock = workflow.slice(preserveStart, cleanStart);

  assert.ok(preserveStart >= 0);
  assert.ok(cleanStart > preserveStart);
  assert.match(preserveBlock, /steps\.semgrep-sast\.outcome != 'success'/);
  assert.match(preserveBlock, /retention-days: 7/);
  assert.match(workflow, /SARIF artifact: not retained for successful scans/);
  assert.match(
    workflow,
    /Diagnostic report: \*\*semgrep-sast-report\*\* workflow artifact \(7 days\)/,
  );
  assert.doesNotMatch(workflow, /- name: Preserve Semgrep SAST report\n/);
});

test("Production DAST runs after production deployments and daily with the shared ZAP policy", async () => {
  const workflow = await readFile(productionDastUrl, "utf8");

  assert.match(workflow, /repository_dispatch:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /www\.bababou\.com/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /x-vercel-protection-bypass/);
  assert.match(workflow, /x-vercel-trusted-oidc-idp-token/);
  assert.match(workflow, /rules_file_name: "\.zap\/rules\.tsv"/);
  assert.match(workflow, /cmd_options: "-I -T 5"/);
  assert.doesNotMatch(workflow, /cmd_options:.*-c \.zap\/rules\.tsv/);
  assert.match(workflow, /fail_action: true/);
  assert.match(workflow, /artifact_name: zap-production-report/);
  assert.match(workflow, /context 'Production DAST'/);
  assert.match(workflow, /H\$high M\$medium L\$low I\$informational/);
});

test("Preview and production ZAP load the shared policy exactly once", async () => {
  const [preview, production] = await Promise.all([
    readFile(zapPreviewUrl, "utf8"),
    readFile(productionDastUrl, "utf8"),
  ]);

  for (const workflow of [preview, production]) {
    assert.match(workflow, /rules_file_name: "\.zap\/rules\.tsv"/);
    assert.match(workflow, /cmd_options: "-I -T 5"/);
    assert.doesNotMatch(workflow, /cmd_options:.*-c \.zap\/rules\.tsv/);
  }
});

test("ZAP suppresses only deterministic informational noise while keeping security debt visible", async () => {
  const rules = await readFile(zapRulesUrl, "utf8");
  const policy = new Map(
    rules
      .trim()
      .split("\n")
      .map((line) => {
        const [id, action, note] = line.split("\t", 3);
        return [id, { action, note }] as const;
      }),
  );

  const ignored = [...policy.entries()]
    .filter(([, rule]) => rule.action === "IGNORE")
    .map(([id]) => id)
    .sort();
  assert.deepEqual(ignored, ["10049", "10050", "10109"]);

  for (const id of ["10020", "10021", "10033", "10035"]) {
    assert.equal(policy.get(id)?.action, "FAIL", `${id} must remain blocking`);
  }

  for (const id of [
    "10010",
    "10011",
    "10015",
    "10017",
    "10027",
    "10038",
    "10044",
    "10098",
    "10099",
    "90003",
    "90004",
  ]) {
    assert.equal(policy.get(id)?.action, "WARN", `${id} must remain visible`);
  }

  assert.match(policy.get("10010")?.note ?? "", /NEXT_LOCALE/);
  assert.match(policy.get("10050")?.note ?? "", /Vercel CDN Age header/);
});
