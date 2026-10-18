import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repo = "AlbanAndrieu/nabla-site-bababou";
const dojoUrl = "https://defectdojo.int.albandrieu.com/api/v2/reimport-scan/";
const mode = process.argv[2] ?? "--check";
if (!["--check", "--collect", "--ingest"].includes(mode)) {
  throw new Error(
    "Usage: node defectdojo-pull-master.mjs [--check|--collect|--ingest]",
  );
}
if (!process.env.GH_TOKEN) {
  throw new Error(
    "GH_TOKEN is required (fine-grained Actions:read on Bababou only)",
  );
}
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
      "--status",
      "success",
      "--limit",
      "5",
      "--json",
      "databaseId,headBranch,headSha,conclusion",
    ]),
  );
  const run = runs.find(
    (item) =>
      item.headBranch === "master" &&
      item.conclusion === "success" &&
      Number.isInteger(item.databaseId) &&
      /^[0-9a-f]{40}$/.test(item.headSha),
  );
  if (!run)
    throw new Error(`NOT_READY: no successful master run for ${workflow}`);
  return run;
}
export function sanitizeTrivy(raw) {
  if (!Array.isArray(raw?.Results)) throw new Error("Invalid Trivy report");
  const vulnerabilities = raw.Results.filter((entry) =>
    String(entry.Target ?? "").includes("package-lock.json"),
  )
    .flatMap((entry) => entry.Vulnerabilities ?? [])
    .filter((item) => ["HIGH", "CRITICAL"].includes(item.Severity))
    .map((item) => ({
      VulnerabilityID: String(item.VulnerabilityID ?? "").slice(0, 90),
      PkgName: String(item.PkgName ?? "").slice(0, 100),
      InstalledVersion: String(item.InstalledVersion ?? "").slice(0, 90),
      FixedVersion: String(item.FixedVersion ?? "").slice(0, 90),
      Severity: item.Severity,
    }))
    .filter((item) => /^[A-Za-z0-9_.@/+-]+$/.test(item.PkgName));
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
      const title = String(alert.alert ?? "ZAP finding")
        .replace(/[^A-Za-z0-9 .,()/_-]/g, "")
        .slice(0, 150);
      rules.set(id, { id, shortDescription: { text: title } });
      results.push({
        ruleId: id,
        level: String(alert.riskcode) === "3" ? "error" : "warning",
        message: { text: title },
      });
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
function validateNuclei(raw) {
  if (!Array.isArray(raw?.runs) || raw.runs.length !== 1) {
    throw new Error("Invalid sanitized Nuclei SARIF");
  }
  const run = raw.runs[0];
  if (run.tool?.driver?.name !== "Nuclei" || !Array.isArray(run.results)) {
    throw new Error("Unexpected SARIF tool or results");
  }
  for (const result of run.results) {
    if (
      Object.keys(result).some(
        (key) => !["ruleId", "level", "message"].includes(key),
      )
    ) {
      throw new Error("Nuclei result contains unapproved data");
    }
    if (/https?:\/\//i.test(String(result.message?.text ?? ""))) {
      throw new Error("Nuclei result contains a URL");
    }
  }
  return raw;
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
  const deep = recentMaster("security-deep.yml");
  const zap = recentMaster("production-dast.yml");
  console.log(
    `Approved master evidence: deep=${deep.databaseId}, ZAP=${zap.databaseId}`,
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
      return JSON.parse(readFileSync(join(destination, file), "utf8"));
    }
    const trivy = sanitizeTrivy(
      download(deep, `trivy-master-${deep.databaseId}`, "trivy-master.json"),
    );
    const nuclei = validateNuclei(
      download(deep, `nuclei-master-${deep.databaseId}`, "nuclei-master.sarif"),
    );
    const zapReport = sanitizeZap(
      download(zap, "zap-production-report", "report_json.json"),
    );
    const count = (report) =>
      report.runs?.[0]?.results?.length ??
      report.Results?.[0]?.Vulnerabilities?.length ??
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
    if (process.env.DEFECTDOJO_ALLOW_NUCLEI === "yes" && count(nuclei) > 0) {
      await upload(
        nuclei,
        "SARIF",
        "Bababou Nuclei safe DAST",
        engagement,
        token,
      );
    }
    if (process.env.DEFECTDOJO_ALLOW_ZAP === "yes" && count(zapReport) > 0) {
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
