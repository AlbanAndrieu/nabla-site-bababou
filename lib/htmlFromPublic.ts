import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPublicHtmlFragment(
	file: string,
	mode: "body",
	_locale?: string,
): Promise<string> {
	const full = path.join(process.cwd(), "public", file);
	const html = await readFile(full, "utf8");
	if (mode !== "body") throw new Error("Only 'body' mode supported");
	return html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
}
