// Pure report projection functions. GitHub collection and DefectDojo ingestion
// are owned exclusively by nabla-compose; this module uses no credentials.
export function sanitizeTrivy(raw) {
  if (!Array.isArray(raw?.Results)) throw new Error("Invalid Trivy report");
  const vulnerabilities = raw.Results.filter(
    (entry) =>
      String(entry.Target ?? "")
        .split(/[\\/]/)
        .at(-1) === "package-lock.json",
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
  if (vulnerabilities.length > 1000)
    throw new Error("Excessive Trivy finding count");
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
  if (run.results.length > 1000)
    throw new Error("Excessive Nuclei finding count");
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
    runs: [
      {
        tool: { driver: { name: "Nuclei", rules: [...rules.values()] } },
        results,
      },
    ],
  };
}
