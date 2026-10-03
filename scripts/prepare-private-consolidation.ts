import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

type SourceScope = "private" | "public-baseline";

type ConsolidationSource = {
  path: string;
  scope: SourceScope;
  language: string;
  role: string;
};

type ConsolidationCollection = {
  id: string;
  title: string;
  sources: ConsolidationSource[];
};

type ConsolidationConfig = {
  version: number;
  collections: ConsolidationCollection[];
};

type Paragraph = {
  text: string;
  fingerprint: string;
};

const ROOT = process.cwd();
const CONFIG_PATH = "config/private-consolidation.json";
const PRIVATE_ROOT = ".private-publication-source/";
const OUTPUT_ROOT = ".redaction-work/consolidation/";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeParagraph(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”«»"'’‘]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function htmlToParagraphs(source: string) {
  const main = source.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? source;
  const withoutNoise = main
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ");
  const blockSeparated = withoutNoise
    .replace(/<\/(?:p|li|h[1-6]|section|div|article|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const text = decodeHtmlEntities(blockSeparated.replace(/<[^>]+>/g, " "));
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length >= 3);
}

function textToParagraphs(source: string) {
  return source
    .split(/\n\s*\n|\n(?=\S)/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph.length >= 3);
}

function toParagraphs(values: string[]): Paragraph[] {
  return values.map((text) => {
    const normalized = normalizeParagraph(text);
    return {
      text,
      fingerprint: sha256(normalized || text),
    };
  });
}

function privatePathIsAllowed(file: string) {
  return file.replaceAll("\\", "/").startsWith(PRIVATE_ROOT);
}

function toolOutput(command: string, args: string[], sourceId: string) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error && (result.error as NodeJS.ErrnoException).code === "ENOENT") {
    throw new Error(`required consolidation tool is missing: ${command}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed for source ${sourceId}`);
  }
  return result.stdout;
}

async function extractSource(source: ConsolidationSource) {
  if (source.scope === "private" && !privatePathIsAllowed(source.path)) {
    throw new Error("private consolidation sources must stay under .private-publication-source/");
  }
  if (source.scope === "public-baseline" && source.path.startsWith(PRIVATE_ROOT)) {
    throw new Error("public baseline cannot point to the private source workspace");
  }

  const absolute = path.join(ROOT, source.path);
  const extension = path.extname(source.path).toLowerCase();
  const sourceId = sha256(source.path).slice(0, 16);

  let rawText: string;
  let paragraphs: Paragraph[];

  if (extension === ".pdf") {
    rawText = toolOutput("pdftotext", ["-layout", absolute, "-"], sourceId);
    paragraphs = toParagraphs(textToParagraphs(rawText));
  } else if (extension === ".html") {
    const html = await readFile(absolute, "utf8");
    const values = htmlToParagraphs(html);
    rawText = values.join("\n\n");
    paragraphs = toParagraphs(values);
  } else {
    throw new Error(`unsupported consolidation source format: ${extension}`);
  }

  return {
    sourceId,
    source,
    rawText,
    paragraphs,
    textSha256: sha256(rawText),
  };
}

export async function preparePrivateConsolidation(collectionId: string) {
  if (!collectionId) {
    throw new Error("provide a consolidation collection id");
  }

  const config = JSON.parse(
    await readFile(path.join(ROOT, CONFIG_PATH), "utf8"),
  ) as ConsolidationConfig;
  if (config.version !== 1 || !Array.isArray(config.collections)) {
    throw new Error(`${CONFIG_PATH} must use schema version 1`);
  }

  const collection = config.collections.find(
    (candidate) => candidate.id === collectionId,
  );
  if (!collection) {
    throw new Error(`unknown consolidation collection: ${collectionId}`);
  }

  const extracted = [];
  for (const source of collection.sources) {
    extracted.push(await extractSource(source));
  }

  const occurrenceCounts = new Map<string, number>();
  for (const item of extracted) {
    for (const paragraph of item.paragraphs) {
      occurrenceCounts.set(
        paragraph.fingerprint,
        (occurrenceCounts.get(paragraph.fingerprint) ?? 0) + 1,
      );
    }
  }

  const outputDirectory = path.join(ROOT, OUTPUT_ROOT, collection.id);
  const sourcesDirectory = path.join(outputDirectory, "sources");
  await mkdir(sourcesDirectory, { recursive: true });

  const seen = new Set<string>();
  const mergedLines = [
    `# ${collection.title}`,
    "",
    "> Draft privé consolidé. Ne pas publier directement.",
    "",
  ];

  const sourceIndex = [];
  for (const item of extracted) {
    const duplicateParagraphs = item.paragraphs.filter(
      (paragraph) => (occurrenceCounts.get(paragraph.fingerprint) ?? 0) > 1,
    ).length;

    sourceIndex.push({
      id: item.sourceId,
      path: item.source.path,
      scope: item.source.scope,
      language: item.source.language,
      role: item.source.role,
      textSha256: item.textSha256,
      paragraphCount: item.paragraphs.length,
      duplicateParagraphs,
      uniqueParagraphs: item.paragraphs.length - duplicateParagraphs,
    });

    await writeFile(
      path.join(sourcesDirectory, `${item.sourceId}.txt`),
      item.rawText + "\n",
      "utf8",
    );

    mergedLines.push(
      `## Source ${item.sourceId} · ${item.source.language} · ${item.source.role}`,
      "",
    );
    for (const paragraph of item.paragraphs) {
      if (seen.has(paragraph.fingerprint)) continue;
      seen.add(paragraph.fingerprint);
      mergedLines.push(paragraph.text, "");
    }
  }

  await writeFile(
    path.join(outputDirectory, "source-index.json"),
    JSON.stringify(
      {
        version: 1,
        collection: collection.id,
        title: collection.title,
        sourceCount: sourceIndex.length,
        paragraphFingerprintCount: occurrenceCounts.size,
        sources: sourceIndex,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  await writeFile(
    path.join(outputDirectory, "merged-draft.md"),
    mergedLines.join("\n").trimEnd() + "\n",
    "utf8",
  );

  const paragraphCount = extracted.reduce(
    (sum, item) => sum + item.paragraphs.length,
    0,
  );
  const duplicateOccurrences = paragraphCount - occurrenceCounts.size;
  console.log(
    `Private consolidation complete: ${extracted.length} source(s), ${paragraphCount} paragraph occurrence(s), ${duplicateOccurrences} duplicate occurrence(s).`,
  );
  console.log(
    `Private output written under ${OUTPUT_ROOT}${collection.id}/.`,
  );
}

async function main() {
  await preparePrivateConsolidation(process.argv[2] ?? "");
}

const executedFile = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";
if (import.meta.url === executedFile) {
  await main();
}
