import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  findIdentitySpans,
  PROTECTED_FATHER_IDENTITY_FINGERPRINTS,
  PROTECTED_MOTHER_IDENTITY_FINGERPRINTS,
} from "./privacy-identities.ts";
import { parsePrivacyPolicy, scanText } from "./privacy-gate.ts";

type AuditDisposition = "BLOCK" | "REWRITE" | "REVIEW";

type AuditFinding = {
  category: string;
  disposition: AuditDisposition;
  line: number;
};

type AuditArtifact = {
  id: string;
  path: string;
  findings: AuditFinding[];
};

type AuditReport = {
  version: number;
  generatedAt: string;
  artifacts: AuditArtifact[];
};

const ROOT = process.cwd();
const POLICY_PATH = ".cursor/mem/privacy-address-phone.md";
const DEFAULT_REPORT = ".redaction-work/private-audit.json";
const ALLOWED_ROOTS = [".private-publication-source", ".redaction-work"];
const TEXT_EXTENSIONS = new Set([".html", ".md", ".txt", ".xml"]);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const RAW_SOURCE_EXTENSIONS = new Set([".docx", ".eml", ".odg", ".xoj"]);

function lineAt(text: string, index: number) {
  return text.slice(0, index).split("\n").length;
}

function artifactId(file: string) {
  return createHash("sha256").update(file).digest("hex").slice(0, 16);
}

function normalizedRelative(input: string) {
  const absolute = path.resolve(ROOT, input);
  const relative = path.relative(ROOT, absolute).replaceAll("\\", "/");
  if (
    relative.startsWith("../") ||
    !ALLOWED_ROOTS.some(
      (root) => relative === root || relative.startsWith(`${root}/`),
    )
  ) {
    throw new Error(
      "private audit inputs must stay under .private-publication-source/ or .redaction-work/",
    );
  }
  return relative;
}

async function collectFiles(relativePath: string): Promise<string[]> {
  const absolute = path.join(ROOT, relativePath);
  const info = await stat(absolute);
  if (info.isFile()) return [relativePath];

  const entries = await readdir(absolute, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const child = path.posix.join(relativePath, entry.name);
      return entry.isDirectory() ? collectFiles(child) : [child];
    }),
  );
  return nested.flat();
}

function toolOutput(command: string, args: string[], id: string) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error && (result.error as NodeJS.ErrnoException).code === "ENOENT") {
    throw new Error(`required private-audit tool is missing: ${command}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed for artifact ${id}`);
  }
  return result.stdout;
}

function identityFindings(
  text: string,
  fingerprints: ReadonlySet<string>,
  category: string,
  disposition: AuditDisposition,
): AuditFinding[] {
  return findIdentitySpans(text, fingerprints).map((match) => ({
    category,
    disposition,
    line: lineAt(text, match.start),
  }));
}

function dedupe(findings: AuditFinding[]) {
  return [
    ...new Map(
      findings.map((finding) => [
        `${finding.disposition}:${finding.category}:${finding.line}`,
        finding,
      ]),
    ).values(),
  ];
}

function scanExtractedText(
  text: string,
  label: string,
  policy: ReturnType<typeof parsePrivacyPolicy>,
) {
  return dedupe([
    ...scanText(text, label, policy).map((finding) => ({
      category: finding.category,
      disposition: finding.disposition,
      line: finding.line,
    })),
    ...identityFindings(
      text,
      PROTECTED_FATHER_IDENTITY_FINGERPRINTS,
      "father-identity",
      "REWRITE",
    ),
    ...identityFindings(
      text,
      PROTECTED_MOTHER_IDENTITY_FINGERPRINTS,
      "mother-identity",
      "REWRITE",
    ),
  ]);
}

async function auditFile(
  file: string,
  policy: ReturnType<typeof parsePrivacyPolicy>,
): Promise<AuditArtifact> {
  const id = artifactId(file);
  const extension = path.extname(file).toLowerCase();
  const absolute = path.join(ROOT, file);

  if (RAW_SOURCE_EXTENSIONS.has(extension)) {
    return {
      id,
      path: file,
      findings: [
        {
          category: "raw-source-manual-conversion-required",
          disposition: "REVIEW",
          line: 1,
        },
      ],
    };
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return {
      id,
      path: file,
      findings: [
        {
          category: "image-manual-visual-review-required",
          disposition: "REVIEW",
          line: 1,
        },
      ],
    };
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    const text = await readFile(absolute, "utf8");
    return {
      id,
      path: file,
      findings: scanExtractedText(text, `${id}::text`, policy),
    };
  }

  if (extension === ".pdf") {
    const text = toolOutput("pdftotext", ["-layout", absolute, "-"], id);
    const metadata = toolOutput("pdfinfo", [absolute], id);
    const attachments = toolOutput("pdfdetach", ["-list", absolute], id);
    const findings = [
      ...scanExtractedText(text, `${id}::pdf-text`, policy),
      ...scanExtractedText(metadata, `${id}::pdf-metadata`, policy),
    ];

    if (!text.trim()) {
      findings.push({
        category: "pdf-no-extractable-text-manual-review-required",
        disposition: "REVIEW",
        line: 1,
      });
    }
    if (!/^0 embedded files\s*$/m.test(attachments)) {
      findings.push({
        category: "pdf-embedded-file",
        disposition: "REVIEW",
        line: 1,
      });
    }
    return { id, path: file, findings: dedupe(findings) };
  }

  return {
    id,
    path: file,
    findings: [
      {
        category: "unsupported-private-format-manual-review-required",
        disposition: "REVIEW",
        line: 1,
      },
    ],
  };
}

export async function runPrivatePublicationAudit(
  inputs: string[],
  reportPath = DEFAULT_REPORT,
) {
  if (!inputs.length) {
    throw new Error(
      "provide one or more private files/directories under .private-publication-source/ or .redaction-work/",
    );
  }

  const policy = parsePrivacyPolicy(
    await readFile(path.join(ROOT, POLICY_PATH), "utf8"),
  );
  const normalizedInputs = inputs.map(normalizedRelative);
  const files = [
    ...new Set(
      (
        await Promise.all(
          normalizedInputs.map((input) => collectFiles(input)),
        )
      ).flat(),
    ),
  ].sort();

  const artifacts = await Promise.all(
    files.map((file) => auditFile(file, policy)),
  );
  const report: AuditReport = {
    version: 1,
    generatedAt: new Date().toISOString(),
    artifacts,
  };

  const normalizedReport = normalizedRelative(reportPath);
  await mkdir(path.dirname(path.join(ROOT, normalizedReport)), {
    recursive: true,
  });
  await writeFile(
    path.join(ROOT, normalizedReport),
    JSON.stringify(report, null, 2) + "\n",
    "utf8",
  );

  const findingCount = artifacts.reduce(
    (total, artifact) => total + artifact.findings.length,
    0,
  );
  const categoryCounts = new Map<string, number>();
  const dispositionCounts = new Map<AuditDisposition, number>();
  for (const artifact of artifacts) {
    for (const finding of artifact.findings) {
      const key = `${finding.disposition} ${finding.category}`;
      categoryCounts.set(key, (categoryCounts.get(key) ?? 0) + 1);
      dispositionCounts.set(
        finding.disposition,
        (dispositionCounts.get(finding.disposition) ?? 0) + 1,
      );
    }
  }

  console.log(
    `Private publication audit complete: ${artifacts.length} artifact(s), ${findingCount} finding(s).`,
  );
  for (const disposition of ["BLOCK", "REWRITE", "REVIEW"] as const) {
    console.log(
      `- ${disposition}: ${dispositionCounts.get(disposition) ?? 0}`,
    );
  }
  for (const [category, count] of [...categoryCounts.entries()].sort()) {
    console.log(`- ${category}: ${count}`);
  }
  console.log(`Private report written to ${normalizedReport}.`);
  return report;
}

async function main() {
  await runPrivatePublicationAudit(process.argv.slice(2));
}

const executedFile = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === executedFile) {
  await main();
}
