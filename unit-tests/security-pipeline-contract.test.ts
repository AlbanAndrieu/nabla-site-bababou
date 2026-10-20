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
    /"\$semgrep_venv[/]bin[/]python" -m pip install --disable-pip-version-check --quiet 'semgrep==1\.145\.0'/,
  );
  assert.match(
    workflow,
    /SEMGREP_SEND_METRICS=off "\$semgrep_venv[/]bin[/]semgrep" scan/,
  );
  assert.doesNotMatch(workflow, /semgrep\/semgrep@sha256:/);
  assert.match(workflow, /python -m venv/);
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

test("Production DAST projection checkout is complete and errors are blocking", async () => {
  const workflow = await readFile(productionDastUrl, "utf8");
  const source = await readFile(
    new URL("../scripts/security/zap-safe-report.mjs", import.meta.url),
    "utf8",
  );
  const checkout = workflow
    .split("- name: Checkout production ZAP policy")[1]
    ?.split("- name: Request GitHub OIDC token")[0];
  assert.ok(checkout);
  assert.match(source, /defectdojo-report-sanitizers/);
  assert.match(checkout, /scripts\/security\/zap-safe-report\.mjs/);
  assert.match(
    checkout,
    /scripts\/security\/defectdojo-report-sanitizers\.mjs/,
  );
  assert.doesNotMatch(checkout, /defectdojo-pull-master/);
  assert.match(workflow, /id: safe-report/);
  assert.match(workflow, /id: safe-upload/);
  assert.match(workflow, /if: always\(\) && \(steps\.preflight/);
  assert.match(workflow, /steps\.safe-report\.outcome != 'success'/);
  assert.match(workflow, /steps\.safe-upload\.outcome != 'success'/);
  assert.match(workflow, /SAFE_REPORT_OUTCOME.*== "success"/);
  assert.match(workflow, /SAFE_UPLOAD_OUTCOME.*== "success"/);
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

test("npm SCA blocks production HIGH/CRITICAL and reports all dev-tool debt", async () => {
  const workflow = await readFile(ciUrl, "utf8");
  const productionStart = workflow.indexOf(
    "      - name: Audit production npm dependencies (blocking SCA)",
  );
  const fullStart = workflow.indexOf(
    "      - name: Report full npm SCA and development-tool debt",
    productionStart,
  );
  const installStart = workflow.indexOf(
    "      - name: Install dependencies",
    fullStart,
  );
  assert.ok(productionStart > 0, "production SCA step is mandatory");
  assert.ok(fullStart > productionStart, "full development SCA must run");
  assert.ok(installStart > fullStart, "SCA runs before dependency install");

  const prod = workflow.slice(productionStart, fullStart);
  assert.match(
    prod,
    /if: github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false/,
  );
  assert.match(prod, /run: npm audit --omit=dev --audit-level=high/);
  assert.doesNotMatch(
    prod,
    /continue-on-error|dependencies ==|SNYK_TOKEN|--offline/,
  );

  const full = workflow.slice(fullStart, installStart);
  assert.match(full, /npm audit --json > "\$report"/);
  assert.match(full, /jq -e '\.metadata\.vulnerabilities \| type == "object"'/);
  assert.match(full, /critical > 0/);
  assert.match(full, /exit 1/);
  assert.match(full, /GITHUB_STEP_SUMMARY/);
  assert.doesNotMatch(
    full,
    /continue-on-error|dependencies ==|SNYK_TOKEN|--omit=dev|--offline/,
  );
  assert.match(workflow, /name: Run Snyk vulnerability scan/);
});

test("Security deep scans run on master only and keep raw HTTP evidence private", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/security-deep.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*pull_request:/m);
  assert.match(workflow, /github.ref == 'refs\/heads\/master'/);
  assert.match(workflow, /scanners: vuln,misconfig,license/);
  assert.match(workflow, /TRIVY_INCLUDE_DEV_DEPS: "true"/);
  assert.match(workflow, /format: cyclonedx/);
  assert.match(workflow, /languages: javascript-typescript/);
  assert.match(workflow, /queries: security-extended/);
  assert.match(workflow, /upload: never/);
  assert.match(workflow, /Full source Semgrep with SARIF/);
  assert.match(workflow, /-rl 2 -c 1 -timeout 5 -retries 0/);
  assert.match(workflow, /-etags dos,fuzz,bruteforce,intrusive/);
  assert.doesNotMatch(workflow, /upload-artifact[\s\S]*?path: .*nuclei.jsonl/);
  assert.match(workflow, /retention-days: 3/g);
});
test("Production DAST schedule has bounded cadence (other runs on release)", async () => {
  const workflow = await readFile(productionDastUrl, "utf8");
  assert.match(workflow, /cron: "23 3 \* \* 2,5"/);
  assert.match(workflow, /repository_dispatch:/);
});
test("PR BetterLeaks scans committed SHA diff, not the empty staging index", async () => {
  const workflow = await readFile(ciUrl, "utf8");
  assert.match(workflow, /name: BetterLeaks committed PR diff \(blocking\)/);
  assert.match(
    workflow,
    /go install github.com\/betterleaks\/betterleaks@v1\.9\.0/,
  );
  assert.match(workflow, /--log-opts="\$\{BASE_SHA\}\.\.\$\{HEAD_SHA\}"/);
  assert.match(workflow, /--config \.betterleaks\.toml --redact/);
  assert.doesNotMatch(
    workflow
      .split("name: BetterLeaks committed PR diff")[1]
      ?.split("      - name:")[0] ?? "",
    /continue-on-error|--staged|\[skip ci\]/,
  );
});

test("Trivy deep scan retains evidence before blocking CRITICAL vulnerabilities", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/security-deep.yml", import.meta.url),
    "utf8",
  );
  const artifact = workflow.indexOf(
    "      - name: Preserve approved master artifacts privately",
  );
  const enforcement = workflow.indexOf(
    "      - name: Enforce CRITICAL Trivy findings after evidence retention",
  );
  const nextJob = workflow.indexOf("\n  codeql:", enforcement);
  assert.ok(artifact > 0);
  assert.ok(enforcement > artifact);
  assert.ok(nextJob > enforcement);
  const gate = workflow.slice(enforcement, nextJob);
  assert.match(gate, /select\(\.Severity == "CRITICAL"\)/);
  assert.match(gate, /critical > 0/);
  assert.match(gate, /exit 1/);
  assert.doesNotMatch(gate, /continue-on-error|--ignore-unfixed/);
});

test("Production ZAP publishes only minimized DAST evidence to the LAN collector", async () => {
  const workflow = await readFile(productionDastUrl, "utf8");
  assert.match(workflow, /name: Produce minimized ZAP SARIF for LAN collector/);
  assert.match(
    workflow,
    /zap-safe-report\.mjs report_json\.json zap-production-safe\.sarif/,
  );
  assert.match(
    workflow,
    /name: zap-production-safe-\$\{\{ github\.run_id \}\}/,
  );
  assert.match(workflow, /retention-days: 3/);
  assert.match(workflow, /steps\.zap\.outcome == 'success'/);
  assert.match(workflow, /zap-production-safe\.sarif/);
  assert.doesNotMatch(
    workflow,
    /DEFECTDOJO_API_TOKEN|DEFECTDOJO_IMPORT_APPROVED/,
  );
});
