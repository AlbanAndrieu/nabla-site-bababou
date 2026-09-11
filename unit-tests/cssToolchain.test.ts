import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function cssFiles(directory: URL): Promise<URL[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const url = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
			if (entry.isDirectory()) {
				return cssFiles(url);
			}
			return entry.isFile() && entry.name.endsWith(".css") ? [url] : [];
		}),
	);
	return files.flat();
}

test("Tailwind stays reset-only until the project owns an equivalent reset", async () => {
	const globals = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
	const postcss = await readFile(new URL("../postcss.config.mjs", import.meta.url), "utf8");
	const packageJson = JSON.parse(
		await readFile(new URL("../package.json", import.meta.url), "utf8"),
	) as { devDependencies?: Record<string, string> };

	assert.match(globals, /^@import "tailwindcss\/preflight\.css" layer\(base\);$/m);
	assert.doesNotMatch(globals, /@import\s+["']tailwindcss["']/);
	assert.doesNotMatch(globals, /tailwindcss\/(?:theme|utilities)\.css/);
	assert.match(postcss, /["']@tailwindcss\/postcss["']/);
	assert.ok(packageJson.devDependencies?.tailwindcss);
	assert.ok(packageJson.devDependencies?.["@tailwindcss/postcss"]);
});

test("maintained CSS does not depend on Tailwind directives or generated utilities", async () => {
	const roots = [new URL("../app/", import.meta.url), new URL("../components/", import.meta.url)];
	const files = (await Promise.all(roots.map(cssFiles))).flat();
	const tailwindDirective = /@(apply|theme|utility|source|variant|custom-variant)\b/;
	const generatedLayerImport = /tailwindcss\/(?:theme|utilities)\.css/;

	for (const file of files) {
		const source = await readFile(file, "utf8");
		assert.doesNotMatch(source, tailwindDirective, `${file.pathname} must stay Tailwind-directive free`);
		assert.doesNotMatch(
			source,
			generatedLayerImport,
			`${file.pathname} must not re-enable Tailwind theme/utilities generation`,
		);
	}
});
