import { readFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_HTML_FILES = new Set([
	"404.html",
	"test.html",
	// add other allowed html files here
]);

export async function loadPublicHtmlFragment(
	file: string,
	mode: "body",
	_locale?: string,
): Promise<string> {
	if (!ALLOWED_HTML_FILES.has(file)) {
		throw new Error(file + " not allowed for loadPublicHtmlFragment");
	}
	const full = path.join(process.cwd(), "public", file);
	const html = await readFile(full, "utf8");
	if (mode !== "body") throw new Error("Only 'body' mode supported");
	return html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
}
