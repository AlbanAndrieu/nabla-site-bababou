import { readFile } from "node:fs/promises";
import path from "node:path";

export type HtmlExtractMode =
  | "body"
  | "main"
  | "headerMain"
  | "navHeaderMain"
  | "mainOuter";
export type SiteLocale = "fr" | "en";

const DEFAULT_LOCALE: SiteLocale = "fr";
const SUPPORTED_LOCALES: readonly SiteLocale[] = ["fr", "en"];

/**
 * Transitional allow-list only.
 *
 * Do not add legacy family-content pages here until they have passed the
 * repository privacy review. Loading a file through this helper makes its
 * markup eligible to be rendered by Next.js.
 */
const PUBLIC_HTML_FILES = [
  "404.html",
  "test.html",
  "policy/accessibility_statement.html",
] as const;
type PublicHtmlFile = (typeof PUBLIC_HTML_FILES)[number];

const PUBLIC_ROOT = path.join(process.cwd(), "public");

/**
 * Keep every filesystem target explicit. A dynamic `path.join(..., file)` made
 * Turbopack conservatively trace the whole public tree even though this helper
 * only permits a small reviewed set of documents.
 */
const DEFAULT_PUBLIC_HTML_PATHS: Record<PublicHtmlFile, string> = {
  "404.html": path.join(PUBLIC_ROOT, "404.html"),
  "test.html": path.join(PUBLIC_ROOT, "test.html"),
  "policy/accessibility_statement.html": path.join(
    PUBLIC_ROOT,
    "policy",
    "accessibility_statement.html",
  ),
};

/**
 * Localized legacy fragments are opt-in as well: add an entry only when that
 * concrete file exists and has passed the same privacy review. Missing locale
 * entries deliberately fall back to the default-language file.
 */
const LOCALIZED_PUBLIC_HTML_PATHS: Partial<
  Record<SiteLocale, Partial<Record<PublicHtmlFile, string>>>
> = {};

function isPublicHtmlFile(file: string): file is PublicHtmlFile {
  return PUBLIC_HTML_FILES.includes(file as PublicHtmlFile);
}

function normalizeLocale(locale?: string): SiteLocale {
  if (locale && SUPPORTED_LOCALES.includes(locale as SiteLocale)) {
    return locale as SiteLocale;
  }
  return DEFAULT_LOCALE;
}

function resolvePublicFilePath(file: string, locale?: string): string {
  if (!isPublicHtmlFile(file)) {
    throw new Error(`${file} not allowed for loadPublicHtmlFragment`);
  }

  const normalizedLocale = normalizeLocale(locale);
  return (
    LOCALIZED_PUBLIC_HTML_PATHS[normalizedLocale]?.[file] ??
    DEFAULT_PUBLIC_HTML_PATHS[file]
  );
}

function localePrefix(locale?: string): string {
  return normalizeLocale(locale) === DEFAULT_LOCALE
    ? ""
    : `/${normalizeLocale(locale)}`;
}

function withLocalePrefix(pathname: string, locale?: string): string {
  if (/^\/(fr|en)(\/|$)/.test(pathname)) return pathname;
  // The homepage remains owner-controlled and mono-canonical at `/` during
  // the hybrid migration; legacy index links must never create `/en` or `/fr`.
  if (pathname === "/") return "/";
  const prefix = localePrefix(locale);
  if (!prefix) return pathname;
  return `${prefix}${pathname}`;
}

function rewriteOneHref(
  quote: '"' | "'",
  raw: string,
  locale?: string,
): string {
  const href = raw.trim();
  if (
    /^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(href) ||
    href.length === 0
  ) {
    return `href=${quote}${raw}${quote}`;
  }

  const reference = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  let pathPart = reference?.[1] ?? href;
  const query = reference?.[2] ?? "";
  const hash = reference?.[3] ?? "";

  while (pathPart.startsWith("../")) pathPart = pathPart.slice(3);
  while (pathPart.startsWith("./")) pathPart = pathPart.slice(2);
  if (!pathPart.endsWith(".html")) {
    return `href=${quote}${raw}${quote}`;
  }

  pathPart = `/${pathPart.replace(/^\/+/, "")}`;
  pathPart = pathPart.replace(/\/index\.html$/i, "").replace(/\.html$/i, "");

  return `href=${quote}${withLocalePrefix(pathPart || "/", locale)}${query}${hash}${quote}`;
}

function rewriteOneSrc(quote: '"' | "'", raw: string): string {
  const src = raw.trim();
  if (
    /^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(src) ||
    src.length === 0 ||
    src.startsWith("/")
  ) {
    return `src=${quote}${raw}${quote}`;
  }

  const reference = src.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  let pathPart = reference?.[1] ?? src;
  const query = reference?.[2] ?? "";
  const hash = reference?.[3] ?? "";

  while (pathPart.startsWith("../")) pathPart = pathPart.slice(3);
  while (pathPart.startsWith("./")) pathPart = pathPart.slice(2);

  return `src=${quote}/${pathPart}${query}${hash}${quote}`;
}

/** Rewrite legacy .html links to the localized extensionless Next.js routes. */
export function rewriteLegacyHtmlHrefs(
  fragment: string,
  locale?: string,
): string {
  let output = fragment.replace(
    /\bhref="([^"]*)"/gi,
    (_full, raw: string) => rewriteOneHref('"', raw, locale),
  );
  output = output.replace(/\bhref='([^']*)'/gi, (_full, raw: string) =>
    rewriteOneHref("'", raw, locale),
  );
  output = output.replace(/\bsrc="([^"]*)"/gi, (_full, raw: string) =>
    rewriteOneSrc('"', raw),
  );
  return output.replace(/\bsrc='([^']*)'/gi, (_full, raw: string) =>
    rewriteOneSrc("'", raw),
  );
}

function escapeRegExpLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Remove legacy sections after an equivalent native React section is introduced. */
export function removeLegacyElementsById(
  fragment: string,
  ids: readonly string[],
): string {
  let output = fragment;
  for (const id of ids) {
    const escapedId = escapeRegExpLiteral(id);
    const pattern = new RegExp(
      `<((?:section|article))\\b(?=[^>]*\\bid=["']${escapedId}["'])[^>]*>[\\s\\S]*?<\\/\\1>`,
      "gi",
    );
    output = output.replace(pattern, "");
  }
  return output;
}

export function extractHtmlFragment(
  html: string,
  mode: HtmlExtractMode,
): string {
  switch (mode) {
    case "body":
      return (
        html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? ""
      ).replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "");
    case "main":
      return html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";
    case "headerMain":
      return (
        html.match(
          /<header[^>]*>[\s\S]*?<\/header>[\s\S]*?<main[^>]*>[\s\S]*?<\/main>/i,
        )?.[0] ?? ""
      );
    case "navHeaderMain":
      return (
        html.match(/<nav[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ??
        ""
      );
    case "mainOuter":
      return html.match(/<main[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? "";
  }
}

export async function loadPublicHtmlFragment(
  file: string,
  mode: HtmlExtractMode,
  locale?: string,
): Promise<string> {
  const full = resolvePublicFilePath(file, locale);
  const html = await readFile(/* turbopackIgnore: true */ full, "utf8");
  let fragment = extractHtmlFragment(html, mode);

  if (!fragment.trim()) {
    throw new Error(
      `Empty HTML fragment: file=${file}, mode=${mode}, locale=${normalizeLocale(locale)}`,
    );
  }

  fragment = fragment.replace(
    /<nav\b[^>]*\bpage-nav\b[^>]*>[\s\S]*?<\/nav>/gi,
    "",
  );
  return rewriteLegacyHtmlHrefs(fragment, locale);
}
