/**
 * Turn producer-minimized Bababou ZAP SARIF into an offline, safe HTML report.
 * Never read raw ZAP JSON; never print HTTP evidence or untrusted descriptions.
 * Retain HIGH and MEDIUM findings: Bababou tracks four historical MEDIUM rules.
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_BYTES = 1_000_000;
function exactKeys(obj, keys) {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj) &&
    Object.keys(obj).length === keys.length && keys.every(key => Object.hasOwn(obj, key));
}

export function renderSafeZapSarif(report) {
  if (!exactKeys(report, ["$schema", "version", "runs"]) ||
      report.version !== "2.1.0" ||
      report.$schema !== "https://json.schemastore.org/sarif-2.1.0.json" ||
      !Array.isArray(report.runs) || report.runs.length !== 1) {
    throw new Error("ZAP_MINIMIZED_SCHEMA_INVALID");
  }
  const run = report.runs[0];
  if (!exactKeys(run, ["tool", "results"]) ||
      !exactKeys(run.tool, ["driver"]) ||
      !exactKeys(run.tool.driver, ["name", "rules"]) ||
      run.tool.driver.name !== "ZAP" ||
      !Array.isArray(run.tool.driver.rules) ||
      !Array.isArray(run.results) || run.results.length > 1000) {
    throw new Error("ZAP_MINIMIZED_RUN_INVALID");
  }
  const ids = new Set();
  for (const rule of run.tool.driver.rules) {
    if (!exactKeys(rule, ["id", "shortDescription"]) ||
        !/^[0-9]{1,12}$/.test(rule.id ?? "") ||
        !exactKeys(rule.shortDescription, ["text"]) ||
        rule.shortDescription.text !== `ZAP rule ${rule.id}` || ids.has(rule.id)) {
      throw new Error("ZAP_MINIMIZED_RULE_INVALID");
    }
    ids.add(rule.id);
  }
  let high = 0, medium = 0;
  const findings = [];
  for (const result of run.results) {
    if (!exactKeys(result, ["ruleId", "level", "message"]) ||
        !ids.has(result.ruleId) ||
        !["error", "warning"].includes(result.level) ||
        !exactKeys(result.message, ["text"]) ||
        result.message.text !== `ZAP rule ${result.ruleId}`) {
      throw new Error("ZAP_MINIMIZED_RESULT_INVALID");
    }
    if (result.level === "error") high++; else medium++;
    findings.push({ id: result.ruleId, label: result.level === "error" ? "HIGH" : "MEDIUM" });
  }
  if (ids.size > 1000) throw new Error("ZAP_MINIMIZED_RULE_LIMIT");
  const rows = findings.map(x => `<tr><td><code>${x.id}</code></td><td>${x.label}</td></tr>`).join("\n");
  const html = [
    "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\">",
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'\">",
    "<title>Bababou — ZAP rapport expurgé</title>",
    "<style>body{max-width:800px;margin:2rem auto;padding:1rem;font:1rem/1.5 system-ui,sans-serif}table{border-collapse:collapse;width:100%}td,th{padding:0.7rem;border-bottom:1px solid #aaa;text-align:left}</style>",
    "</head><body><h1>OWASP ZAP · Bababou · rapport expurgé</h1>",
    `<p>Identifiants HIGH : <strong>${high}</strong> ; MEDIUM : <strong>${medium}</strong>.</p>`,
    "<table><thead><tr><th>Règle ZAP</th><th>Sévérité</th></tr></thead><tbody>", rows, "</tbody></table>",
    "<p>Les chemins, réponses HTTP, cookies, personnes et preuves brutes sont exclus. Zéro finding conservé ne prouve pas l'absence de vulnérabilités.</p>",
    "</body></html>\n",
  ].join("\n");
  const summary = [
    "### ZAP Bababou — rapport expurgé",
    "",
    `- HIGH : **${high}**`,
    `- MEDIUM : **${medium}**`,
    "- Rapport HTML et SARIF disponible dans l'artefact privé du run (3 jours).",
    "- Aucune URL détaillée, requête, réponse HTTP, cookie ni preuve brute n'est conservée.",
    "- Ce tableau ne certifie pas l'absence de vulnérabilités.",
    "",
  ].join("\n");
  return { html, summary, high, medium };
}

function main(args) {
  if (args.length !== 3) throw new Error("ZAP_REPORT_PATHS_REQUIRED");
  const [source, htmlPath, summaryPath] = args;
  const stat = statSync(source);
  if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error("ZAP_REPORT_INPUT_INVALID");
  const output = renderSafeZapSarif(JSON.parse(readFileSync(source, "utf8")));
  if (Buffer.byteLength(output.html) > MAX_BYTES || Buffer.byteLength(output.summary) > MAX_BYTES) {
    throw new Error("ZAP_REPORT_OUTPUT_INVALID");
  }
  writeFileSync(htmlPath, output.html, { mode: 0o600, flag: "wx" });
  writeFileSync(summaryPath, output.summary, { mode: 0o600, flag: "wx" });
  console.log(`ZAP_SANITIZED_REPORT_READY: H${output.high} M${output.medium}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { main(process.argv.slice(2)); }
  catch {
    console.error("ZAP_PRESENTATION_REJECTED: invalid or unsafe minimized evidence");
    process.exitCode = 1;
  }
}
