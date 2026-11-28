/**
 * Classify OWASP ZAP medium/high alert *variants*, not HTTP evidence.
 * This intentionally reads the ephemeral raw report on the runner but emits
 * ONLY numeric plugin IDs, numeric alertRef variants, aggregate counts.
 * No URL, URI, headers, response, cookie, title, payload or person is emitted.
 */
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_INPUT_BYTES = 8_000_000;
const MAX_GROUPS = 100;
const VALID_ORIGINS = new Set([
  "https://www.bababou.com",
  "https://bababou.com",
  "https://bababou.albandrieu.com",
]);
const RULE_ID = /^[0-9]{1,12}$/;
const VALID_RISK = new Set(["2", "3"]);

export function summarizeZapRuleReferences(report) {
  if (!report || typeof report !== "object" || Array.isArray(report) ||
    !Array.isArray(report.site) || !report.site.length || report.site.length > 20) {
    throw new Error("ZAP_TRIAGE_INVALID_INPUT");
  }

  const byRule = new Map();
  for (const site of report.site) {
    if (!site || typeof site !== "object" || Array.isArray(site) ||
      typeof site["@name"] !== "string" ||
      !Array.isArray(site.alerts) || site.alerts.length > 2000) {
      throw new Error("ZAP_TRIAGE_INVALID_SITE");
    }

    let origin;
    try {
      const url = new URL(site["@name"]);
      if (url.protocol !== "https:" || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash ||
        (url.port && url.port !== "443")) throw new Error("invalid");
      origin = url.origin;
    } catch { throw new Error("ZAP_TRIAGE_INVALID_ORIGIN"); }
    if (!VALID_ORIGINS.has(origin)) throw new Error("ZAP_TRIAGE_INVALID_ORIGIN");

    for (const alert of site.alerts) {
      if (!alert || typeof alert !== "object" || Array.isArray(alert)) {
        throw new Error("ZAP_TRIAGE_INVALID_ALERT");
      }
      if (!VALID_RISK.has(String(alert.riskcode))) continue;
      const pluginid = String(alert.pluginid ?? "");
      if (!RULE_ID.test(pluginid)) throw new Error("ZAP_TRIAGE_INVALID_RULE_ID");
      const proposed = String(alert.alertRef ?? "");
      // ZAP alertRef may identify subalerts (10055-4 vs 10055-13).
      // Never use the untrusted rule title or other report content as output.
      const subtype = new RegExp("^" + pluginid + "(?:-[0-9]{1,3})?$").test(proposed)
        ? proposed : "unspecified";
      const key = pluginid + ":" + subtype;
      const current = byRule.get(key) ?? { pluginid, subtype, alerts: 0, instances: 0 };
      current.alerts++;
      if (Array.isArray(alert.instances)) {
        if (alert.instances.length > 10000) throw new Error("ZAP_TRIAGE_TOO_MANY_INSTANCES");
        current.instances += alert.instances.length;
      }
      byRule.set(key, current);
      if (byRule.size > MAX_GROUPS) throw new Error("ZAP_TRIAGE_TOO_MANY_GROUPS");
    }
  }

  const rows = [...byRule.values()].sort((a, b) =>
    Number(a.pluginid) - Number(b.pluginid) || a.subtype.localeCompare(b.subtype));
  return [
    "### ZAP Bababou — variantes des règles MEDIUM/HIGH",
    "",
    "Données autorisées : IDs de règles et agrégats uniquement. Aucun chemin ou contenu HTTP.",
    "",
    "| Règle | Variante | Alertes | Instances |",
    "| --- | --- | ---: | ---: |",
    ...rows.map(x => `| ${x.pluginid} | ${x.subtype} | ${x.alerts} | ${x.instances} |`),
    "",
    "Les variantes « unspecified » exigent une revue du rapport source sur un environnement approuvé.",
    "",
  ].join("\n");
}

function main(args) {
  if (args.length !== 1) throw new Error("ZAP_TRIAGE_PATH_REQUIRED");
  const file = args[0];
  const stat = statSync(file);
  if (!stat.isFile() || stat.size > MAX_INPUT_BYTES) throw new Error("ZAP_TRIAGE_INPUT_BUDGET");
  const output = summarizeZapRuleReferences(JSON.parse(readFileSync(file, "utf8")));
  if (Buffer.byteLength(output, "utf8") > 16000) throw new Error("ZAP_TRIAGE_OUTPUT_BUDGET");
  process.stdout.write(output);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { main(process.argv.slice(2)); }
  catch {
    // Never print attacker-controlled names, paths, response data or HTTP traces.
    console.error("ZAP_TRIAGE_REJECTED: invalid or unsafe source evidence");
    process.exitCode = 1;
  }
}
