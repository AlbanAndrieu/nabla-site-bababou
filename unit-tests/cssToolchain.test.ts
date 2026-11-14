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

test("the app owns its browser reset instead of importing Tailwind Preflight", async () => {
	const [globals, reset, packageRaw, lockRaw] = await Promise.all([
		readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
		readFile(new URL("../app/reset.css", import.meta.url), "utf8"),
		readFile(new URL("../package.json", import.meta.url), "utf8"),
		readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
	]);
	const pkg = JSON.parse(packageRaw) as {
		scripts?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};
	const lock = JSON.parse(lockRaw) as { packages?: Record<string, unknown> };

	assert.match(globals, /^@import "\.\/reset\.css";$/m);
	assert.doesNotMatch(globals, /tailwindcss|@(?:apply|theme|utility|source|variant|custom-variant)\b/);
	assert.doesNotMatch(reset, /--theme\(|@import\s+["']tailwindcss|@(?:apply|theme|utility|source|variant|custom-variant)\b/);
	assert.match(reset, /box-sizing:\s*border-box/);
	assert.match(reset, /h1,[\s\S]*h6[\s\S]*font-size:\s*inherit/);
	assert.match(reset, /ol,[\s\S]*menu[\s\S]*list-style:\s*none/);
	assert.match(reset, /img,[\s\S]*object[\s\S]*display:\s*block/);
	assert.match(reset, /button,[\s\S]*::file-selector-button[\s\S]*font:\s*inherit/);
	assert.match(reset, /\[hidden\]:where\(:not\(\[hidden="until-found"\]\)\)[\s\S]*display:\s*none !important/);
	assert.match(pkg.scripts?.["lint:css"] ?? "", /stylelint \"app\/\*\.css\"/);
	assert.match(pkg.scripts?.["lint:css:fix"] ?? "", /stylelint --fix \"app\/\*\.css\"/);
	assert.equal(pkg.devDependencies?.tailwindcss, undefined);
	assert.equal(pkg.devDependencies?.["@tailwindcss/postcss"], undefined);
	for (const packagePath of Object.keys(lock.packages ?? {})) {
		assert.ok(
			!packagePath.startsWith("node_modules/@tailwindcss/") && packagePath !== "node_modules/tailwindcss",
			`${packagePath} must not remain in the npm lock graph`,
		);
	}

	await assert.rejects(
		() => readFile(new URL("../postcss.config.mjs", import.meta.url), "utf8"),
		(error: NodeJS.ErrnoException) => error.code === "ENOENT",
	);
});

test("maintained CSS does not depend on Tailwind directives or generated layers", async () => {
	const roots = [new URL("../app/", import.meta.url), new URL("../components/", import.meta.url)];
	const files = (await Promise.all(roots.map(cssFiles))).flat();
	const tailwindDirective = /@(apply|theme|utility|source|variant|custom-variant)\b/;
	const tailwindImport = /@import\s+["'][^"']*tailwindcss|tailwindcss\/(?:preflight|theme|utilities)\.css/;

	for (const file of files) {
		const source = await readFile(file, "utf8");
		assert.doesNotMatch(source, tailwindDirective, `${file.pathname} must stay Tailwind-directive free`);
		assert.doesNotMatch(source, tailwindImport, `${file.pathname} must not import Tailwind CSS layers`);
	}
});


test("native Next rendering never links the Pingendo wireframe stylesheet", async () => {
  const [layout, globals, foundation, originalHome, wireframe] = await Promise.all([
    readFile(new URL("../app/[locale]/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/native-foundation.css", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/wireframe.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(layout, /href=["']\/wireframe\.css["']/);
  assert.match(globals, /^@import "\.\/native-foundation\.css";$/m);
  assert.match(foundation, /html\[data-nabla-app="next-intl"\]/);
  assert.match(foundation, /main h1[\s\S]*font-weight:\s*700/);
  assert.match(foundation, /main ul[\s\S]*list-style-type:\s*disc/);
  assert.match(foundation, /main ol[\s\S]*list-style-type:\s*decimal/);
  assert.match(foundation, /:focus-visible/);
  assert.match(foundation, /@media print/);
  assert.match(originalHome, /href="wireframe\.css"/);
  assert.match(wireframe, /Bootstrap v4\.1\.3/);

  for (const root of [
    new URL("../app/", import.meta.url),
    new URL("../components/", import.meta.url),
  ]) {
    for (const file of await cssFiles(root)) {
      const stylesheet = await readFile(file, "utf8");
      assert.doesNotMatch(
        stylesheet, /@import\s+(?:url\()?["']?\/?wireframe\.css/i,
        String(file) + " should not depend on the legacy vendor bundle",
      );
    }
  }
});


test("Next excludes landing and style bundles and owns contact CSS", async () => {
  const [layout, contact, stylesheet, archive, foundation] = await Promise.all([
    readFile(new URL("../app/[locale]/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[locale]/contact/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/[locale]/contact/page.module.css", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/native-foundation.css", import.meta.url), "utf8"),
  ]);
  for (const name of ["wireframe.css", "landing-sections.css", "style.css"]) {
    assert.doesNotMatch(layout, new RegExp("href=[\"']/" + name.replace(".", "\\.") + "[\"']"));
    assert.match(archive, new RegExp("href=[\"']" + name.replace(".", "\\.") + "[\"']"));
  }
  assert.match(contact, /import styles from "\.\/page\.module\.css"/);
  for (const key of ["page","section","sectionTitle","sectionSubtitle","methods","method","icon","info","proof","location"]) {
    assert.match(contact, new RegExp("styles\\." + key + "\\b"));
    assert.match(stylesheet, new RegExp("\\." + key + "\\s*\\{"));
  }
  assert.doesNotMatch(contact, /className="(?:contact-methods|contact-method|section-title|section-subtitle)"/);
  assert.match(stylesheet, /grid-template-columns:\s*repeat\(auto-fit/);
  assert.match(stylesheet, /a\.method:focus-visible/);
  assert.match(foundation, /html\[data-nabla-app="next-intl"\] \.skip-to-main:focus-visible/);
});


test("native palette replaces theme.css while matching its light/dark variables", async () => {
  const [layout, globals, tokens, nativeTheme, originalTheme] = await Promise.all([
    readFile(new URL("../app/[locale]/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/design-tokens.css", import.meta.url), "utf8"),
    readFile(new URL("../app/native-theme.css", import.meta.url), "utf8"),
    readFile(new URL("../public/theme.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(layout, /href=["']\/theme\.css["']/);
  assert.match(globals, /^@import "\.\/native-theme\.css";$/m);
  assert.match(tokens, /var\(--bg-primary/);
  assert.match(tokens, /var\(--text-primary/);
  const start = originalTheme.indexOf(":root {");
  const end = originalTheme.indexOf("/* ============================================\n   Apply Theme Variables to Elements");
  assert.ok(start >= 0 && end > start);
  const historicPalette = originalTheme.slice(start, end).trim();
  assert.equal(nativeTheme.slice(nativeTheme.indexOf(":root {")).trim(), historicPalette);
  assert.match(nativeTheme, /@media \(prefers-color-scheme: dark\)/);
  assert.match(nativeTheme, /html\[data-theme="light"\]/);
  assert.match(nativeTheme, /html\[data-theme="dark"\]/);
});
