// Fail-closed producer-side minimization: never upload a raw ZAP report.
// Keep Bababou's MEDIUM and HIGH findings (unlike the Alban HIGH-only collector).
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sanitizeZap } from "./defectdojo-report-sanitizers.mjs";

const PUBLIC_ORIGINS = new Set([
  "https://www.bababou.com",
  "https://bababou.com",
  "https://bababou.albandrieu.com",
]);
const MAX_INPUT_BYTES = 8_000_000;
const MAX_OUTPUT_BYTES = 1_000_000;

export function validateZapProducerInput(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
      !Array.isArray(raw.site) || raw.site.length === 0 || raw.site.length > 20) {
    throw new Error("Invalid ZAP report sites");
  }
  for (const site of raw.site) {
    if (!site || typeof site !== "object" || Array.isArray(site) ||
        typeof site["@name"] !== "string" ||
        !Array.isArray(site.alerts) || site.alerts.length > 2000) {
      throw new Error("Invalid ZAP site structure");
    }
    let url;
    try {
      url = new URL(site["@name"]);
    } catch {
      throw new Error("Invalid ZAP site URL");
    }
    if (!PUBLIC_ORIGINS.has(url.origin) || url.username || url.password ||
        (url.port && url.port !== "443") || url.pathname !== "/" ||
        url.search || url.hash || url.protocol !== "https:") {
      throw new Error("ZAP site outside approved public origins");
    }
    for (const alert of site.alerts) {
      if (!alert || typeof alert !== "object" || Array.isArray(alert)) {
        throw new Error("Invalid ZAP alert");
      }
      if (["2", "3"].includes(String(alert.riskcode)) &&
          !/^[0-9]{1,12}$/.test(String(alert.pluginid ?? ""))) {
        throw new Error("Invalid medium/high ZAP rule identifier");
      }
    }
  }
  return raw;
}

export function minimizeZapProducerReport(raw) {
  const report = sanitizeZap(validateZapProducerInput(raw));
  if (report.version !== "2.1.0" ||
      report.runs?.[0]?.tool?.driver?.name !== "ZAP" ||
      !Array.isArray(report.runs[0].results)) {
    throw new Error("Invalid minimized ZAP evidence");
  }
  return report;
}

function main(args) {
  if (args.length !== 2) throw new Error("Expected exactly input and output paths");
  const [source, target] = args;
  const inputStat = statSync(source);
  if (!inputStat.isFile() || inputStat.size > MAX_INPUT_BYTES) {
    throw new Error("ZAP input exceeds size budget");
  }
  const report = minimizeZapProducerReport(JSON.parse(readFileSync(source, "utf8")));
  const output = JSON.stringify(report) + "\n";
  if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) {
    throw new Error("Minimized ZAP evidence exceeds size budget");
  }
  // Exclusive, owner-only output; never replace an existing trusted artifact.
  writeFileSync(target, output, { mode: 0o600, flag: "wx" });
  console.log(`Minimized ZAP findings: ${report.runs[0].results.length}`);
}

if (process.argv[1] &&
    import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main(process.argv.slice(2));
  } catch {
    // Do not echo raw ZAP evidence, URL paths, credentials or filesystem errors.
    console.error("ZAP_SAFE_REPORT_REJECTED: invalid or unsafe producer evidence");
    process.exitCode = 1;
  }
}
