import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const messagesDir = path.join(projectRoot, "messages");
const sourcePath = path.join(messagesDir, "en.json");
const targetPath = path.join(messagesDir, "fr.json");

const LIBRETRANSLATE_URL =
	process.env.LIBRETRANSLATE_URL ?? "https://libretranslate.com/translate";
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY;

async function translateText(text) {
	const payload = {
		q: text,
		source: "en",
		target: "fr",
		format: "text",
	};

	if (LIBRETRANSLATE_API_KEY) {
		payload.api_key = LIBRETRANSLATE_API_KEY;
	}

	const response = await fetch(LIBRETRANSLATE_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`LibreTranslate request failed (${response.status}): ${body.slice(0, 500)}`,
		);
	}

	const result = await response.json();
	return result.translatedText;
}

async function translateNode(node) {
	if (typeof node === "string") {
		return translateText(node);
	}

	if (Array.isArray(node)) {
		const translatedItems = [];
		for (const item of node) {
			translatedItems.push(await translateNode(item));
		}
		return translatedItems;
	}

	if (node && typeof node === "object") {
		const output = {};
		for (const [key, value] of Object.entries(node)) {
			output[key] = await translateNode(value);
		}
		return output;
	}

	return node;
}

async function main() {
	await mkdir(messagesDir, { recursive: true });

	const sourceRaw = await readFile(sourcePath, "utf-8");
	const sourceMessages = JSON.parse(sourceRaw);

	const translatedMessages = await translateNode(sourceMessages);
	await writeFile(targetPath, `${JSON.stringify(translatedMessages, null, "\t")}\n`, "utf-8");

	console.log(`French messages updated at ${path.relative(projectRoot, targetPath)}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
