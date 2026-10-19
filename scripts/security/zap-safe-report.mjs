import { readFileSync, writeFileSync } from "node:fs";
import { sanitizeZap } from "./defectdojo-pull-master.mjs";

const [source, target] = process.argv.slice(2);
if (!source || !target || process.argv.length !== 4) {
  throw new Error("Usage: zap-safe-report.mjs input-zap.json output-zap.sarif");
}
const raw = JSON.parse(readFileSync(source, "utf8"));
const report = sanitizeZap(raw);
if (
  report.version !== "2.1.0" ||
  report.runs?.[0]?.tool?.driver?.name !== "ZAP" ||
  !Array.isArray(report.runs[0].results)
) {
  throw new Error("Sanitized ZAP evidence is invalid");
}
writeFileSync(target, `${JSON.stringify(report)}\n`, { mode: 0o600 });
console.log(`Minimized ZAP findings: ${report.runs[0].results.length}`);
