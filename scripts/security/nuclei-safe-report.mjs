import { readFileSync, writeFileSync } from "node:fs";

const [source, target] = process.argv.slice(2);
if (!source || !target) {
  console.error("Usage: node nuclei-safe-report.mjs input.jsonl output.sarif");
  process.exit(2);
}

const findings = readFileSync(source, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const levels = { critical: "error", high: "error", medium: "warning" };
const rules = new Map();
const results = [];
for (const finding of findings) {
  const id = String(finding["template-id"] || "");
  if (!/^[A-Za-z0-9_.-]{1,128}$/.test(id)) {
    throw new Error("Unexpected Nuclei template identifier");
  }
  const severity = String(finding.info?.severity || "").toLowerCase();
  if (!Object.hasOwn(levels, severity)) continue;
  const title = String(finding.info?.name || id)
    .replace(/[^A-Za-z0-9 .,()/_-]/g, "")
    .slice(0, 160);
  if (!rules.has(id)) {
    rules.set(id, { id, shortDescription: { text: title } });
  }
  // Never transfer matched URLs, IPs, HTTP requests, responses or secrets.
  results.push({
    ruleId: id,
    level: levels[severity],
    message: { text: title },
  });
}
const report = {
  version: "2.1.0",
  $schema: "https://json.schemastore.org/sarif-2.1.0.json",
  runs: [
    {
      tool: { driver: { name: "Nuclei", rules: [...rules.values()] } },
      results,
    },
  ],
};
writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `Nuclei sanitized results: ${results.length}; original HTTP evidence retained only on ephemeral runner`,
);
