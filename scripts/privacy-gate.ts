import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type PrivacyCategory =
  | "protected-address"
  | "private-phone"
  | "official-document-identifier"
  | "medical-or-psychological";

export type PrivacyFinding = {
  category: PrivacyCategory;
  file: string;
  line: number;
};

export type PrivacyPolicy = {
  protectedAddress: string;
  generalizedLocation: string;
  privatePhone: string;
  maskedPhone: string;
};

const ROOT = process.cwd();
const POLICY_PATH = ".cursor/mem/privacy-address-phone.md";
const ADDRESS_PHONE_EXCEPTION = "public/assets/nabla/signature/";
const SCAN_TARGETS = ["public/index.html", "app", "components", "messages"];
const TEXT_EXTENSIONS = new Set([
  ".html",
  ".js",
  ".json",
  ".jsonld",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".xml",
]);

const MEDICAL_OR_PSYCHOLOGICAL_PATTERNS = [
  /\bdiagnos(?:is|ed|tic)\b/gi,
  /\bmedication\b/gi,
  /\bmedical\s+(?:condition|record|report|assessment)\b/gi,
  /\bpsychological\s+(?:condition|record|report|assessment|evaluation)\b/gi,
  /\bpsychiatric\b/gi,
  /\bpsychotherapy\b/gi,
  /\btherapy\s+(?:record|report|session|treatment)\b/gi,
];

const OFFICIAL_IDENTIFIER_PATTERNS = [
  /\b(?:passport|identity\s+card|national\s+id|official\s+document)\b[^\n<]{0,120}\b(?:id|number|no\.?)\b\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{5,})/gi,
  /["'](?:passport(?:Number|Id)?|documentNumber|identity(?:Card)?Number)["']\s*:\s*["']?([A-Z0-9-]{6,})/gi,
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function flexibleTextRegex(value: string) {
  const tokens = value
    .trim()
    .split(/[\s,.;:'"()/_-]+/)
    .filter(Boolean)
    .map(escapeRegex);
  return new RegExp(tokens.join("[\\s,.;:'\"()/_-]*"), "gi");
}

function flexiblePhoneRegex(value: string) {
  const digits = value.replace(/\D/g, "").split("");
  return new RegExp(digits.map(escapeRegex).join("\\D{0,3}"), "g");
}

function lineAt(text: string, index: number) {
  return text.slice(0, index).split("\n").length;
}

function firstCapture(source: string, pattern: RegExp, label: string) {
  const match = source.match(pattern)?.[1]?.trim();
  if (!match) throw new Error(`Privacy policy is missing ${label}`);
  return match;
}

export function parsePrivacyPolicy(source: string): PrivacyPolicy {
  return {
    generalizedLocation: firstCapture(
      source,
      /Use\s+"([^"]+)"\s+instead\s+of/i,
      "the generalized location",
    ),
    protectedAddress: firstCapture(
      source,
      /instead\s+of\s+(.+?)\.\s*$/im,
      "the protected address",
    ),
    privatePhone: firstCapture(
      source,
      /Last\s+2\s+digits\s+of\s+(.+?)\s+must\s+not/i,
      "the private phone",
    ),
    maskedPhone: firstCapture(
      source,
      /use\s+(.+?)\s+when\s+the\s+number\s+is\s+shown/i,
      "the masked phone",
    ),
  };
}

function collectPatternFindings(
  text: string,
  pattern: RegExp,
  category: PrivacyCategory,
  file: string,
) {
  const findings: PrivacyFinding[] = [];
  pattern.lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    findings.push({
      category,
      file,
      line: lineAt(text, match.index ?? 0),
    });
  }
  return findings;
}

export function scanText(
  text: string,
  file: string,
  policy: PrivacyPolicy,
): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const normalizedFile = file.replaceAll("\\", "/");
  const addressPhoneAllowed = normalizedFile.startsWith(ADDRESS_PHONE_EXCEPTION);

  if (!addressPhoneAllowed) {
    findings.push(
      ...collectPatternFindings(
        text,
        flexibleTextRegex(policy.protectedAddress),
        "protected-address",
        file,
      ),
      ...collectPatternFindings(
        text,
        flexiblePhoneRegex(policy.privatePhone),
        "private-phone",
        file,
      ),
    );
  }

  for (const pattern of OFFICIAL_IDENTIFIER_PATTERNS) {
    findings.push(
      ...collectPatternFindings(
        text,
        pattern,
        "official-document-identifier",
        file,
      ),
    );
  }

  for (const pattern of MEDICAL_OR_PSYCHOLOGICAL_PATTERNS) {
    findings.push(
      ...collectPatternFindings(
        text,
        pattern,
        "medical-or-psychological",
        file,
      ),
    );
  }

  return [...new Map(findings.map((finding) => [`${finding.category}:${finding.file}:${finding.line}`, finding])).values()];
}

async function collectTextFiles(relativePath: string): Promise<string[]> {
  const absolutePath = path.join(ROOT, relativePath);
  const stat = await import("node:fs/promises").then(({ stat }) => stat(absolutePath));
  if (stat.isFile()) return [relativePath];

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const child = path.posix.join(relativePath.replaceAll("\\", "/"), entry.name);
      if (entry.isDirectory()) return collectTextFiles(child);
      if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) return [child];
      return [];
    }),
  );
  return nested.flat();
}

export async function runPrivacyGate(): Promise<PrivacyFinding[]> {
  const policySource = await readFile(path.join(ROOT, POLICY_PATH), "utf8");
  const policy = parsePrivacyPolicy(policySource);
  const files = (await Promise.all(SCAN_TARGETS.map(collectTextFiles))).flat();
  const findings: PrivacyFinding[] = [];

  for (const file of files) {
    const text = await readFile(path.join(ROOT, file), "utf8");
    findings.push(...scanText(text, file, policy));
  }

  return findings;
}

async function main() {
  const findings = await runPrivacyGate();
  if (!findings.length) {
    console.log("Privacy gate passed: no protected publication values detected.");
    return;
  }

  console.error(`Privacy gate failed: ${findings.length} protected publication finding(s).`);
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.category}]`);
  }
  process.exitCode = 1;
}

const executedFile = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === executedFile) {
  await main();
}
