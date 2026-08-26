import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  findIdentitySpans,
  PROTECTED_CHILD_IDENTITY_FINGERPRINTS,
  type IdentityFingerprintSet,
} from "./privacy-identities.ts";

export type PrivacyCategory =
  | "protected-child-identity"
  | "protected-address"
  | "private-phone"
  | "official-document-identifier"
  | "official-document-artifact"
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

type PrivacyGateOptions = {
  includeBuild?: boolean;
};

type SourceMapRecord = {
  sources?: unknown;
  sourcesContent?: unknown;
  sections?: unknown;
};

const ROOT = process.cwd();
const POLICY_PATH = ".cursor/mem/privacy-address-phone.md";
const ADDRESS_PHONE_EXCEPTION = "public/assets/nabla/signature/";
const APPROVED_PUBLIC_IDENTIFIER = "14CV32249";
const APPROVED_PUBLIC_DOCUMENT_ASSET = "public/assets/passport-fr-bababou-4.png";
const APPROVED_PUBLIC_DOCUMENT_ASSET_REFERENCE = "assets/passport-fr-bababou-4.png";
const PUBLIC_CONTACT_SURFACES = [
  "app/[locale]/contact/page.tsx",
  "app/[locale]/email/page.tsx",
  "messages/contact/",
  "messages/email/",
];
const SOURCE_SCAN_TARGETS = [
  "public/index.html",
  "app",
  "components",
  "i18n",
  "lib",
  "messages",
  "proxy.ts",
  "next.config.mjs",
];
const BUILD_SCAN_TARGETS = [".next/server", ".next/static"];
const TEXT_EXTENSIONS = new Set([
  ".body",
  ".html",
  ".js",
  ".json",
  ".jsonld",
  ".jsx",
  ".map",
  ".md",
  ".meta",
  ".mjs",
  ".rsc",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
]);

const MEDICAL_OR_PSYCHOLOGICAL_PATTERNS = [
  /\b(?:medical|clinical|psychiatric|psychological)\s+diagnos(?:is|es|tic)\b/gi,
  /\bdiagnosed\s+with\b/gi,
  /\bmedications?\b/gi,
  /\bmedical\s+(?:condition|record|report|assessment|history|treatment)\b/gi,
  /\bpsychological\s+(?:condition|record|report|assessment|evaluation|treatment)\b/gi,
  /\bpsychiatric\s+(?:condition|record|report|assessment|treatment)\b/gi,
  /\bpsychotherapy\b/gi,
  /\btherapy\s+(?:record|report|session|treatment)\b/gi,
];

const OFFICIAL_IDENTIFIER_PATTERNS = [
  /\b(?:passport|identity\s+card|national\s+id|official\s+document)\b[^\n<]{0,120}\b(?:id|number|no\.?)\b\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{5,})/gi,
  /["'](?:passport(?:Number|Id)?|documentNumber|identity(?:Card)?Number)["']\s*:\s*["']?([A-Z0-9-]{6,})/gi,
];

const OFFICIAL_DOCUMENT_ARTIFACT_PATTERNS = [
  /<(?:a|img)\b[^>]*(?:href|src)=["'][^"']*(?:passport|identity[-_ ]?card|national[-_ ]?id)[^"']*["'][^>]*>/gi,
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

function dedupeFindings(findings: PrivacyFinding[]) {
  return [
    ...new Map(
      findings.map((finding) => [
        `${finding.category}:${finding.file}:${finding.line}`,
        finding,
      ]),
    ).values(),
  ];
}

function isPublicContactSurface(file: string) {
  const normalized = file.replaceAll("\\", "/");
  return PUBLIC_CONTACT_SURFACES.some(
    (surface) => normalized === surface || normalized.startsWith(surface),
  );
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

function collectOfficialIdentifierFindings(text: string, file: string) {
  const findings: PrivacyFinding[] = [];
  for (const pattern of OFFICIAL_IDENTIFIER_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const identifier = match[1];
      if (identifier === APPROVED_PUBLIC_IDENTIFIER) continue;
      findings.push({
        category: "official-document-identifier",
        file,
        line: lineAt(text, match.index ?? 0),
      });
    }
  }
  return findings;
}

function collectOfficialArtifactFindings(text: string, file: string) {
  if (file.replaceAll("\\", "/") === APPROVED_PUBLIC_DOCUMENT_ASSET) return [];

  const findings: PrivacyFinding[] = [];
  for (const pattern of OFFICIAL_DOCUMENT_ARTIFACT_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (match[0].includes(APPROVED_PUBLIC_DOCUMENT_ASSET_REFERENCE)) continue;
      findings.push({
        category: "official-document-artifact",
        file,
        line: lineAt(text, match.index ?? 0),
      });
    }
  }
  return findings;
}

export function scanText(
  text: string,
  file: string,
  policy: PrivacyPolicy,
  childIdentityFingerprints: IdentityFingerprintSet =
    PROTECTED_CHILD_IDENTITY_FINGERPRINTS,
): PrivacyFinding[] {
  const findings: PrivacyFinding[] = [];
  const normalizedFile = file.replaceAll("\\", "/");
  const signatureException = normalizedFile.startsWith(ADDRESS_PHONE_EXCEPTION);
  const publicContactSurface = isPublicContactSurface(normalizedFile);

  for (const match of findIdentitySpans(text, childIdentityFingerprints)) {
    findings.push({
      category: "protected-child-identity",
      file,
      line: lineAt(text, match.start),
    });
  }

  if (!signatureException) {
    findings.push(
      ...collectPatternFindings(
        text,
        flexibleTextRegex(policy.protectedAddress),
        "protected-address",
        file,
      ),
    );
  }

  if (!signatureException && !publicContactSurface) {
    findings.push(
      ...collectPatternFindings(
        text,
        flexiblePhoneRegex(policy.privatePhone),
        "private-phone",
        file,
      ),
    );
  }

  findings.push(
    ...collectOfficialIdentifierFindings(text, file),
    ...collectOfficialArtifactFindings(text, file),
  );

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

  return dedupeFindings(findings);
}

function isDependencySource(source: string) {
  const normalized = source.replaceAll("\\", "/");
  return (
    normalized.includes("/node_modules/") ||
    normalized.startsWith("node_modules/") ||
    normalized.startsWith("node:")
  );
}

/**
 * Source maps are JSON containers, not published prose. Scan project-owned
 * sourcesContent individually so unrelated map metadata/dependency sources
 * cannot create cross-boundary or framework false positives.
 */
export function scanSourceMap(
  text: string,
  file: string,
  policy: PrivacyPolicy,
): PrivacyFinding[] {
  const parsed = JSON.parse(text) as SourceMapRecord;
  const findings: PrivacyFinding[] = [];

  function visit(sourceMap: SourceMapRecord) {
    const sources = Array.isArray(sourceMap.sources) ? sourceMap.sources : [];
    const sourcesContent = Array.isArray(sourceMap.sourcesContent)
      ? sourceMap.sourcesContent
      : [];

    sources.forEach((source, index) => {
      const content = sourcesContent[index];
      if (
        typeof source !== "string" ||
        typeof content !== "string" ||
        isDependencySource(source)
      ) {
        return;
      }
      findings.push(...scanText(content, `${file}::${source}`, policy));
    });

    if (!Array.isArray(sourceMap.sections)) return;
    for (const section of sourceMap.sections) {
      if (!section || typeof section !== "object") continue;
      const nested = (section as { map?: unknown }).map;
      if (nested && typeof nested === "object") {
        visit(nested as SourceMapRecord);
      }
    }
  }

  visit(parsed);
  return dedupeFindings(findings);
}

async function collectTextFiles(relativePath: string): Promise<string[]> {
  const absolutePath = path.join(ROOT, relativePath);
  const entryStat = await stat(absolutePath);
  if (entryStat.isFile()) return [relativePath];

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const child = path.posix.join(
        relativePath.replaceAll("\\", "/"),
        entry.name,
      );
      if (entry.isDirectory()) return collectTextFiles(child);
      if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) {
        return [child];
      }
      return [];
    }),
  );
  return nested.flat();
}

export async function runPrivacyGate({
  includeBuild = false,
}: PrivacyGateOptions = {}): Promise<PrivacyFinding[]> {
  const policySource = await readFile(path.join(ROOT, POLICY_PATH), "utf8");
  const policy = parsePrivacyPolicy(policySource);
  const targets = includeBuild
    ? [...SOURCE_SCAN_TARGETS, ...BUILD_SCAN_TARGETS]
    : SOURCE_SCAN_TARGETS;
  const files = (await Promise.all(targets.map(collectTextFiles))).flat();
  const findings: PrivacyFinding[] = [];

  for (const file of files) {
    const text = await readFile(path.join(ROOT, file), "utf8");
    if (file.startsWith(".next/") && file.endsWith(".map")) {
      findings.push(...scanSourceMap(text, file, policy));
    } else {
      findings.push(...scanText(text, file, policy));
    }
  }

  return dedupeFindings(findings);
}

async function main() {
  const includeBuild = process.argv.includes("--build");
  const findings = await runPrivacyGate({ includeBuild });
  if (!findings.length) {
    console.log(
      includeBuild
        ? "Privacy gate passed: sources and generated Next output are clean."
        : "Privacy gate passed: no protected publication values detected.",
    );
    return;
  }

  console.error(
    `Privacy gate failed: ${findings.length} protected publication finding(s).`,
  );
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.category}]`);
  }
  process.exitCode = 1;
}

const executedFile = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === executedFile) {
  await main();
}
