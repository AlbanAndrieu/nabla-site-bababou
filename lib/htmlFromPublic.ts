import { readFile } from "node:fs/promises";
import path from "node:path";

export type HtmlExtractMode = "body";

const PUBLIC_404_FILE = "404.html" as const;
const PUBLIC_404_PATH = path.join(process.cwd(), "public", PUBLIC_404_FILE);

export function extractHtmlFragment(
  html: string,
  mode: HtmlExtractMode,
): string {
  if (mode === "body") {
    return (
      html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? ""
    ).replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "");
  }

  return "";
}

/**
 * Load the one reviewed legacy HTML fragment that intentionally remains part
 * of the Next runtime. The custom 404 stays source-controlled in public/404.html
 * by repository policy; all policy pages are native React content now.
 */
export async function loadPublicHtmlFragment(
  file: string,
  mode: HtmlExtractMode,
  _locale?: string,
): Promise<string> {
  if (file !== PUBLIC_404_FILE) {
    throw new Error(`${file} not allowed for loadPublicHtmlFragment`);
  }

  const html = await readFile(/* turbopackIgnore: true */ PUBLIC_404_PATH, "utf8");
  const fragment = extractHtmlFragment(html, mode);

  if (!fragment.trim()) {
    throw new Error(`Empty HTML fragment: file=${file}, mode=${mode}`);
  }

  return fragment;
}
