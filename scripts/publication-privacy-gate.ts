import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  findIdentitySpans,
  PROTECTED_FATHER_IDENTITY_FINGERPRINTS,
  PROTECTED_MOTHER_IDENTITY_FINGERPRINTS,
} from "./privacy-identities.ts";
import {
  parsePrivacyPolicy,
  scanText,
  type PrivacyDisposition,
} from "./privacy-gate.ts";

type ReviewEntry = {
  path: string;
  reviewed: boolean;
  sourceOutsideGit: boolean;
  irreversibleRedactionVerified: boolean;
  metadataReviewed: boolean;
  sensitiveDataApproved?: boolean;
  officialIdentifiersReviewed?: boolean;
};

type ReviewManifest = {
  version: number;
  artifacts: ReviewEntry[];
};

type PublicationFinding = {
  category: string;
  disposition: PrivacyDisposition;
  file: string;
};

const ROOT = process.cwd();
const POLICY_PATH = ".cursor/mem/privacy-address-phone.md";
const MANIFEST_PATH = "config/publication-review.json";
const RAW_SOURCE_EXTENSIONS = new Set([".docx", ".eml", ".odg", ".xoj"]);
const TEXT_EXTENSIONS = new Set([".html", ".md", ".txt", ".xml"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function isPublicationPath(file: string) {
  const normalized = file.replaceAll("\\", "/");
  return (
    normalized === "public/abduction-norway-lawyers.html" ||
    normalized.startsWith("public/ca/") ||
    normalized.startsWith("public/eml/")
  );
}

export function isForbiddenSourcePath(file: string) {
  const normalized = file.replaceAll("\\", "/");
  if (normalized.startsWith("public/eml/")) return true;
  return RAW_SOURCE_EXTENSIONS.has(path.extname(normalized).toLowerCase());
}

export function reviewEntryIsComplete(entry: ReviewEntry | undefined) {
  return Boolean(
    entry?.reviewed &&
      entry.sourceOutsideGit &&
      entry.irreversibleRedactionVerified &&
      entry.metadataReviewed,
  );
}

function gitLines(args: string[]) {
  try {
    const output = execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function resolveBaseRef() {
  if (process.env.QUALITY_BASE_REF?.trim()) {
    return process.env.QUALITY_BASE_REF.trim();
  }
  for (const candidate of ["origin/master", "origin/main", "HEAD~1"]) {
    if (gitLines(["rev-parse", "--verify", `${candidate}^{commit}`]).length) {
      return candidate;
    }
  }
  return "HEAD";
}

function collectChangedPublicationFiles() {
  const baseRef = resolveBaseRef();
  const files = new Set<string>();

  if (baseRef !== "HEAD") {
    for (const file of gitLines([
      "diff",
      "--name-only",
      "--diff-filter=ACMR",
      `${baseRef}...HEAD`,
    ])) {
      files.add(file);
    }
  }

  for (const args of [
    ["diff", "--name-only", "--diff-filter=ACMR"],
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const file of gitLines(args)) files.add(file);
  }

  return [...files].filter(isPublicationPath).sort();
}

function toolOutput(command: string, args: string[], file: string) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error && (result.error as NodeJS.ErrnoException).code === "ENOENT") {
    throw new Error(`required verification tool is missing: ${command}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed for ${file}`);
  }
  return result.stdout;
}

async function loadManifest() {
  const source = await readFile(path.join(ROOT, MANIFEST_PATH), "utf8");
  const manifest = JSON.parse(source) as ReviewManifest;
  if (manifest.version !== 1 || !Array.isArray(manifest.artifacts)) {
    throw new Error(`${MANIFEST_PATH} must use schema version 1`);
  }
  return new Map(manifest.artifacts.map((entry) => [entry.path, entry]));
}

function parentIdentityFindings(
  text: string,
  file: string,
): PublicationFinding[] {
  const findings: PublicationFinding[] = [];
  for (const [fingerprints, category] of [
    [PROTECTED_FATHER_IDENTITY_FINGERPRINTS, "father-identity"],
    [PROTECTED_MOTHER_IDENTITY_FINGERPRINTS, "mother-identity"],
  ] as const) {
    if (findIdentitySpans(text, fingerprints).length) {
      findings.push({ category, disposition: "REWRITE", file });
    }
  }
  return findings;
}

function reviewFindingApproved(
  finding: PublicationFinding,
  entry: ReviewEntry | undefined,
) {
  if (finding.disposition !== "REVIEW") return false;
  if (
    finding.category === "medical-or-psychological" ||
    finding.category === "special-category-personal-data"
  ) {
    return entry?.sensitiveDataApproved === true;
  }
  if (
    finding.category === "official-document-identifier" ||
    finding.category === "official-document-artifact"
  ) {
    return entry?.officialIdentifiersReviewed === true;
  }
  return false;
}

async function scanTextArtifact(
  file: string,
  policy: ReturnType<typeof parsePrivacyPolicy>,
) {
  const text = await readFile(path.join(ROOT, file), "utf8");
  return [
    ...scanText(text, file, policy).map((finding) => ({
      category: finding.category,
      disposition: finding.disposition,
      file,
    })),
    ...parentIdentityFindings(text, file),
  ];
}

function scanPdfArtifact(
  file: string,
  policy: ReturnType<typeof parsePrivacyPolicy>,
): PublicationFinding[] {
  const findings: PublicationFinding[] = [];
  const absolute = path.join(ROOT, file);
  const extractedText = toolOutput("pdftotext", ["-layout", absolute, "-"], file);
  const metadata = toolOutput("pdfinfo", [absolute], file);
  const attachments = toolOutput("pdfdetach", ["-list", absolute], file);

  for (const finding of scanText(extractedText, `${file}::pdf-text`, policy)) {
    findings.push({
      category: finding.category,
      disposition: finding.disposition,
      file,
    });
  }
  for (const finding of scanText(metadata, `${file}::pdf-metadata`, policy)) {
    findings.push({
      category: finding.category,
      disposition: finding.disposition,
      file,
    });
  }
  findings.push(
    ...parentIdentityFindings(extractedText, file),
    ...parentIdentityFindings(metadata, file),
  );
  if (!/^0 embedded files\s*$/m.test(attachments)) {
    findings.push({
      category: "pdf-embedded-file",
      disposition: "REVIEW",
      file,
    });
  }
  return findings;
}

async function main() {
  const files = collectChangedPublicationFiles();
  if (!files.length) {
    console.log(
      "Publication privacy gate passed: no changed sensitive publication artifacts.",
    );
    return;
  }

  const [policySource, manifest] = await Promise.all([
    readFile(path.join(ROOT, POLICY_PATH), "utf8"),
    loadManifest(),
  ]);
  const policy = parsePrivacyPolicy(policySource);
  const findings: PublicationFinding[] = [];

  for (const file of files) {
    if (isForbiddenSourcePath(file)) {
      findings.push({
        category: "raw-source-artifact-not-publishable",
        disposition: "BLOCK",
        file,
      });
      continue;
    }

    const extension = path.extname(file).toLowerCase();
    if (IMAGE_EXTENSIONS.has(extension)) {
      findings.push({
        category: "image-requires-explicit-reviewed-publication-copy",
        disposition: "REVIEW",
        file,
      });
      continue;
    }

    if (!reviewEntryIsComplete(manifest.get(file))) {
      findings.push({
        category: "publication-review-incomplete",
        disposition: "BLOCK",
        file,
      });
      continue;
    }

    if (TEXT_EXTENSIONS.has(extension)) {
      findings.push(...(await scanTextArtifact(file, policy)));
      continue;
    }

    if (extension === ".pdf") {
      findings.push(...scanPdfArtifact(file, policy));
      continue;
    }

    findings.push({
      category: "unsupported-publication-format",
      disposition: "REVIEW",
      file,
    });
  }

  const deduped = [
    ...new Map(
      findings.map((finding) => [
        `${finding.disposition}:${finding.category}:${finding.file}`,
        finding,
      ]),
    ).values(),
  ];

  const unresolved = deduped.filter(
    (finding) =>
      !reviewFindingApproved(finding, manifest.get(finding.file)),
  );

  if (!unresolved.length) {
    console.log(
      `Publication privacy gate passed: ${files.length} reviewed artifact(s) are eligible for publication.`,
    );
    return;
  }

  console.error(
    `Publication privacy gate failed: ${unresolved.length} unresolved finding(s).`,
  );
  for (const finding of unresolved) {
    console.error(
      `- ${finding.file} [${finding.disposition}:${finding.category}]`,
    );
  }
  process.exitCode = 1;
}

await main();
