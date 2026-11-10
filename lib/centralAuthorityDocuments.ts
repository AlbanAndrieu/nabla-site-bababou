import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { type AppLocale, routing } from "@/i18n/routing";
import { pseudonymizeProtectedChildIdentity } from "@/scripts/privacy-identities";

export type CentralAuthorityDocument = {
  directory: string;
  filename: string;
  href: string;
  relativePath: string;
  sourceLocale: AppLocale | null;
  title: string;
  variantKey: string;
};

const CENTRAL_AUTHORITY_ROOT = path.join(process.cwd(), "public", "ca");
const ROOT_INDEX = "index.html";

function decodeHtmlText(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferredLocale(relativePath: string, html: string): AppLocale | null {
  const filenameLocale = relativePath.match(/-(fr|en|de|no)\.html$/i)?.[1]?.toLowerCase();
  if (filenameLocale && routing.locales.includes(filenameLocale as AppLocale)) {
    return filenameLocale as AppLocale;
  }

  const htmlLocale = html
    .match(/<html[^>]*\blang=["']([^"']+)["']/i)?.[1]
    ?.toLowerCase()
    .split("-")[0];
  if (htmlLocale && routing.locales.includes(htmlLocale as AppLocale)) {
    return htmlLocale as AppLocale;
  }

  return null;
}

function titleFromHtml(html: string, relativePath: string) {
  const rawTitle =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
    path.basename(relativePath, ".html").replace(/[-_]+/g, " ");

  return pseudonymizeProtectedChildIdentity(
    decodeHtmlText(rawTitle).replace(/\s*\|\s*Bababou\s*$/i, ""),
  );
}

function publicHref(relativePath: string) {
  const encoded = relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/ca/${encoded}`;
}

async function walkHtmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return walkHtmlFiles(absolutePath);
        if (entry.isFile() && entry.name.endsWith(".html")) return [absolutePath];
        return [];
      }),
  );

  return nested.flat();
}

export async function listCentralAuthorityDocuments(): Promise<
  CentralAuthorityDocument[]
> {
  const files = await walkHtmlFiles(CENTRAL_AUTHORITY_ROOT);
  const documents = await Promise.all(
    files.map(async (absolutePath) => {
      const relativePath = path
        .relative(CENTRAL_AUTHORITY_ROOT, absolutePath)
        .split(path.sep)
        .join("/");
      if (relativePath === ROOT_INDEX) return null;

      const html = await readFile(absolutePath, "utf8");
      const directoryName = path.posix.dirname(relativePath);
      const directory = directoryName === "." ? "" : directoryName;
      const filename = path.posix.basename(relativePath);

      return {
        directory,
        filename,
        href: publicHref(relativePath),
        relativePath,
        sourceLocale: inferredLocale(relativePath, html),
        title: titleFromHtml(html, relativePath),
        variantKey: relativePath
          .replace(/\.html$/i, "")
          .replace(/-(fr|en|de|no)$/i, ""),
      } satisfies CentralAuthorityDocument;
    }),
  );

  return documents
    .filter((document): document is CentralAuthorityDocument => document !== null)
    .sort(
      (left, right) =>
        left.directory.localeCompare(right.directory) ||
        left.variantKey.localeCompare(right.variantKey) ||
        (left.sourceLocale ?? "").localeCompare(right.sourceLocale ?? "") ||
        left.filename.localeCompare(right.filename),
    );
}
