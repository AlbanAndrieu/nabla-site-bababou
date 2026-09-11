import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(projectRoot, "public");
const cdnFontAwesome = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/";

async function collectHtmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectHtmlFiles(target);
      return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
    }),
  );
  return nested.flat();
}

test("legacy HTML uses the vendored Font Awesome bundle instead of cdnjs", async () => {
  await Promise.all([
    access(path.join(publicRoot, "assets/fontawesome/css/fontawesome.css")),
    access(path.join(publicRoot, "assets/fontawesome/css/brands.css")),
    access(path.join(publicRoot, "assets/fontawesome/css/solid.css")),
    access(path.join(publicRoot, "assets/fontawesome/webfonts/fa-brands-400.woff2")),
    access(path.join(publicRoot, "assets/fontawesome/webfonts/fa-solid-900.woff2")),
  ]);

  const offenders: string[] = [];
  for (const file of await collectHtmlFiles(publicRoot)) {
    const source = await readFile(file, "utf8");
    if (source.includes(cdnFontAwesome)) {
      offenders.push(path.relative(projectRoot, file));
    }
  }

  assert.deepEqual(offenders, []);
});
