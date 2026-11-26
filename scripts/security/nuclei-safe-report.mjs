// Producer-side fail-closed minimization for Bababou Nuclei master scans.
// Publish rule IDs and severity only. Never copy a finding name or matched URL.
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const PUBLIC_HOSTS = new Set(["www.bababou.com", "bababou.com", "bababou.albandrieu.com"]);
const LEVELS = Object.freeze({ critical: "error", high: "error", medium: "warning" });
const MAX_INPUT_BYTES = 8_000_000;
const MAX_FINDINGS = 1000;

export function sanitizeNucleiJsonl(input) {
  if (typeof input !== "string" || Buffer.byteLength(input) > MAX_INPUT_BYTES) {
    throw new Error("NUCLEI_INPUT_SIZE_INVALID");
  }
  const rules = new Map();
  const results = [];
  for (const line of input.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (!row || typeof row !== "object" || Array.isArray(row) ||
        !row.info || typeof row.info !== "object" || Array.isArray(row.info)) {
      throw new Error("NUCLEI_REPORT_INVALID");
    }
    const severity = String(row.info.severity ?? "").toLowerCase();
    if (!Object.hasOwn(LEVELS, severity)) continue;
    const id = row["template-id"] ?? row.templateID;
    if (typeof id !== "string" || !/^[A-Za-z0-9_.-]{1,128}$/.test(id) || row.type !== "http") {
      throw new Error("NUCLEI_FINDING_INVALID");
    }
    let url;
    try {
      url = new URL(row["matched-at"] ?? row.host);
    } catch {
      throw new Error("NUCLEI_TARGET_INVALID");
    }
    if (url.protocol !== "https:" || !PUBLIC_HOSTS.has(url.hostname) ||
        url.username || url.password || url.port) {
      throw new Error("NUCLEI_TARGET_OUT_OF_SCOPE");
    }
    const title = `Nuclei template ${id}`;
    rules.set(id, { id, shortDescription: { text: title } });
    results.push({ ruleId: id, level: LEVELS[severity], message: { text: title } });
    if (results.length > MAX_FINDINGS) throw new Error("NUCLEI_FINDINGS_LIMIT");
  }
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [{ tool: { driver: { name: "Nuclei", rules: [...rules.values()] } }, results }],
  };
}

function main(args) {
  if (args.length !== 2) throw new Error("NUCLEI_INPUT_OUTPUT_REQUIRED");
  const [source, destination] = args;
  const stat = statSync(source);
  if (!stat.isFile() || stat.size > MAX_INPUT_BYTES) throw new Error("NUCLEI_INPUT_SIZE_INVALID");
  const sarif = sanitizeNucleiJsonl(readFileSync(source, "utf8"));
  const json = JSON.stringify(sarif) + "\n";
  if (Buffer.byteLength(json) > 1_000_000) throw new Error("NUCLEI_OUTPUT_SIZE_INVALID");
  writeFileSync(destination, json, { flag: "wx", mode: 0o600 });
  console.log(`NUCLEI_SANITIZED_FINDINGS=${sarif.runs[0].results.length}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    main(process.argv.slice(2));
  } catch {
    console.error("NUCLEI_SAFE_REPORT_REJECTED: invalid or unsafe evidence");
    process.exitCode = 1;
  }
}
