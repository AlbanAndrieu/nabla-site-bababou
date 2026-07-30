import { readFile } from "node:fs/promises";
import path from "node:path";

const HTML_FILE_PATHS: { [filename: string]: string } = {
  "404.html": path.join(process.cwd(), "public", "404.html"),
  "test.html": path.join(process.cwd(), "public", "test.html"),
  // Add other allowed html files here
};

export async function loadPublicHtmlFragment(
  file: string,
  mode: "body",
  _locale?: string,
): Promise<string> {
  const full = HTML_FILE_PATHS[file];
  if (!full) {
    throw new Error(file + " not allowed for loadPublicHtmlFragment");
  }
  const html = await readFile(/*turbopackIgnore: true*/ full, "utf8");
  if (mode !== "body") throw new Error("Only 'body' mode supported");
  return html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
}
