import { spawnSync } from "node:child_process";
import { lstatSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repo = "AlbanAndrieu/nabla-site-bababou";
const dojoUrl = "https://defectdojo.int.albandrieu.com/api/v2/reimport-scan/";
function gh(args) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    env: process.env,
  });
  if (result.error || result.status !== 0) {
    throw new Error("Approved GitHub Actions read failed");
  }
  return result.stdout;
}
const maxReportAgeMs = 10 * 24 * 60 * 60 * 1000;
const maxArtifactBytes = 32 * 1024 * 1024;

// A previous successful run must never mask a newer failed or incomplete run.
export function chooseMasterRun(runs, workflow, now = Date.now()) {
  if (!Array.isArray(runs)) throw new Error("Invalid workflow run list");
  const run = runs.find((item) => item?.headBranch === "master");
  if (!run || run.status !== "completed" || run.conclusion !== "success") {
    throw new Error(`NOT_READY: latest master run for ${workflow} has not passed`);
  }
  if (
    !Number.isSafeInteger(run.databaseId) ||
    run.databaseId <= 0 ||
    !/^[0-9a-f]{40}$/.test(run.headSha ?? "")
  ) {
    throw new Error("Invalid approved master run identity");
  }
  const created = Date.parse(run.createdAt ?? "");
  if (
    !Number.isFinite(created) ||
    created > now + 60000 ||
    now - created > maxReportAgeMs
  ) {
    throw new Error(`STALE: master evidence for ${workflow} is older than ten days`);
  }
  return run;
}
function recentMaster(workflow) {
  const runs = JSON.parse(
    gh([
      "run",
      "list",
      "--repo",
      repo,
      "--workflow",
      workflow,
      "--branch",
      "master",
      "--limit",
      "10",
      "--json",
      "databaseId,headBranch,headSha,conclusion,status,createdAt",
    ]),
  );
  return chooseMasterRun(runs, workflow);
}
export function sanitizeTrivy(raw) {
  if (!Array.isArray(raw?.Results)) throw new Error("Invalid Trivy report");
  const vulnerabilities = raw.Results.filter(
    (entry) => String(entry.Target ?? "").split(/[\\/]/).at(-1) === "package-lock.json",
  )
    .flatMap((entry) => entry.Vulnerabilities ?? [])
    .filter((item) => ["HIGH", "CRITICAL"].includes(item.Severity))
    .map((item) => {
      const cleaned = {
        VulnerabilityID: String(item.VulnerabilityID ?? ""),
        PkgName: String(item.PkgName ?? ""),
        InstalledVersion: String(item.InstalledVersion ?? ""),
        FixedVersion: String(item.FixedVersion ?? ""),
        Severity: item.Severity,
      };
      if (
        !/^[A-Za-z0-9_.-]{1,90}$/.test(cleaned.VulnerabilityID) ||
        !/^[@A-Za-z0-9_.+/-]{1,100}$/.test(cleaned.PkgName) ||
        !/^[A-Za-z0-9.+_~:,*<>=| -]{1,90}$/.test(cleaned.InstalledVersion) ||
        (cleaned.FixedVersion &&
          !/^[A-Za-z0-9.+_~:,*<>=| -]{1,90}$/.test(cleaned.FixedVersion))
      ) {
        throw new Error("Unapproved Trivy identifier or version");
      }
      return cleaned;
    });
  if (vulnerabilities.length > 1000) throw new Error("Excessive Trivy finding count");
  return {
    SchemaVersion: 2,
    Results: vulnerabilities.length
      ? [
          {
            Target: "package-lock.json",
            Class: "lang-pkgs",
            Type: "npm",
            Vulnerabilities: vulnerabilities,
          },
        ]
      : [],
  };
}
export function sanitizeZap(raw) {
  if (!Array.isArray(raw?.site)) throw new Error("Invalid ZAP report");
  const rules = new Map();
  const results = [];
  for (const site of raw.site) {
    for (const alert of site.alerts ?? []) {
      if (!["2", "3"].includes(String(alert.riskcode))) continue;
      const id = String(alert.pluginid ?? "");
      if (!/^[0-9]{1,12}$/.test(id)) continue;
      // Never propagate alert text, raw URLs, request bodies or arbitrary PII.
      const title = `ZAP rule ${id}`;
      rules.set(id, { id, shortDescription: { text: title } });
      results.push({
        ruleId: id,
        level: String(alert.riskcode) === "3" ? "error" : "warning",
        message: { text: title },
      });
      if (results.length > 1000) throw new Error("Excessive ZAP finding count");
    }
  }
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: { driver: { name: "ZAP", rules: [...rules.values()] } },
        results,
      },
    ],
  };
}
export function sanitizeNuclei(raw) {
  if (!Array.isArray(raw?.runs) || raw.runs.length !== 1) {
    throw new Error("Invalid sanitized Nuclei SARIF");
  }
  const run = raw.runs[0];
  if (run.tool?.driver?.name !== "Nuclei" || !Array.isArray(run.results)) {
    throw new Error("Unexpected SARIF tool or results");
  }
  if (run.results.length > 1000) throw new Error("Excessive Nuclei finding count");
  const rules = new Map();
  const results = [];
  for (const result of run.results) {
    const id = result?.ruleId;
    if (!/^[A-Za-z0-9_.-]{1,128}$/.test(id ?? "")) {
      throw new Error("Unapproved Nuclei rule ID");
    }
    if (!["error", "warning"].includes(result.level)) {
      throw new Error("Unapproved Nuclei severity");
    }
    // Rebuild from safe IDs: even a tampered upstream SARIF cannot smuggle data.
    const title = `Nuclei template ${id}`;
    rules.set(id, { id, shortDescription: { text: title } });
    results.push({ ruleId: id, level: result.level, message: { text: title } });
  }
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{ tool: { driver: { name: "Nuclei", rules: [...rules.values()] } }, results }],
  };
}
async function upload(report, type, title, engagementId, token) {
  const file = new globalThis.File(
    [JSON.stringify(report)],
    "approved-findings.json",
    {
      type: "application/json",
    },
  );
  const form = new globalThis.FormData();
  form.set("scan_type", type);
  form.set("engagement", engagementId);
  form.set("test_title", title);
  form.set("minimum_severity", "Medium");
  form.set("auto_create_context", "false");
  form.set("do_not_reactivate", "true");
  form.set("file", file);
  const response = await fetch(dojoUrl, {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
    body: form,
    redirect: "error",
    signal: globalThis.AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`DefectDojo import failed (HTTP ${response.status})`);
  console.log(
    `DefectDojo accepted ${title}; verify server-side parser and deduplication`,
  );
}
async function main() {
  const mode = process.argv[2] ?? "--check";
  if (!["--check", "--collect", "--ingest"].includes(mode)) {
    throw new Error("Usage: defectdojo-pull-master.mjs [--check|--collect|--ingest]");
  }
  if (!process.env.GH_TOKEN) {
    throw new Error("GH_TOKEN is required (Actions:read, Bababou only)");
  }
  // Download optional DAST only when expressly authorized by the operator.
  const includeNuclei = process.env.DEFECTDOJO_ALLOW_NUCLEI === "yes";
  const includeZap = process.env.DEFECTDOJO_ALLOW_ZAP === "yes";
  const deep = recentMaster("security-deep.yml");
  const zap = includeZap ? recentMaster("production-dast.yml") : null;
  console.log(
    `Approved master evidence: deep=${deep.databaseId}, ZAP=${zap?.databaseId ?? "not-selected"}`,
  );
  if (mode === "--check") return;

  const dir = mkdtempSync(join(tmpdir(), "bababou-dojo-"));
  try {
    function download(run, name, file) {
      const destination = join(dir, name);
      gh([
        "run",
        "download",
        String(run.databaseId),
        "--repo",
        repo,
        "--name",
        name,
        "--dir",
        destination,
      ]);
      const target = join(destination, file);
      const stat = lstatSync(target);
      if (!stat.isFile() || stat.size > maxArtifactBytes) {
        throw new Error("Unexpected artifact type or size");
      }
      return JSON.parse(readFileSync(target, "utf8"));
    }
    const trivy = sanitizeTrivy(
      download(deep, `trivy-master-${deep.databaseId}`, "trivy-master.json"),
    );
    const nuclei = includeNuclei
      ? sanitizeNuclei(
          download(deep, `nuclei-master-${deep.databaseId}`, "nuclei-master.sarif"),
        )
      : null;
    const zapReport = zap
      ? sanitizeZap(download(zap, "zap-production-report", "report_json.json"))
      : null;
    const count = (report) =>
      report?.runs?.[0]?.results?.length ??
      report?.Results?.[0]?.Vulnerabilities?.length ??
      0;
    console.log(
      `Sanitized allowlist: Trivy=${count(trivy)} Nuclei=${count(nuclei)} ZAP=${count(zapReport)}; no raw evidence exported`,
    );
    if (mode !== "--ingest") return;
    if (process.env.DEFECTDOJO_INGEST_APPROVED !== "yes") {
      throw new Error("DEFECTDOJO_INGEST_APPROVED=yes is required");
    }
    const engagement = process.env.DEFECTDOJO_ENGAGEMENT_ID ?? "";
    const token = process.env.DEFECTDOJO_API_TOKEN ?? "";
    if (!/^[1-9][0-9]*$/.test(engagement) || !token) {
      throw new Error(
        "Scoped DefectDojo token and numeric engagement ID required",
      );
    }
    if (count(trivy) > 0) {
      await upload(
        trivy,
        "Trivy Scan",
        "Bababou npm HIGH/CRITICAL",
        engagement,
        token,
      );
    }
    if (includeNuclei && count(nuclei) > 0) {
      await upload(
        nuclei,
        "SARIF",
        "Bababou Nuclei safe DAST",
        engagement,
        token,
      );
    }
    if (includeZap && count(zapReport) > 0) {
      await upload(
        zapReport,
        "SARIF",
        "Bababou ZAP safe DAST",
        engagement,
        token,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const invoked = process.argv[1]?.endsWith("defectdojo-pull-master.mjs");
if (invoked) {
  main().catch(() => {
    console.error(
      "DefectDojo collector failed; no raw GitHub report or token disclosed",
    );
    process.exitCode = 1;
  });
}
