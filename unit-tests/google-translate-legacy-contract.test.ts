import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = resolve(projectRoot, "public");

async function collectHtml(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtml(absolute)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(absolute);
    }
  }
  return files;
}

test("legacy HTML uses the shared Google Translate bootstrap only", async () => {
  for (const path of await collectHtml(publicRoot)) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, /google-translate-config\.js/);
    assert.doesNotMatch(
      source,
      /<script[^>]+translate\.google\.com\/translate_a\/element\.js/i,
    );
  }
});

test("site-google-translate owns the retained legacy Google loader", async () => {
  const source = await readFile(
    resolve(publicRoot, "site-google-translate.js"),
    "utf8",
  );

  assert.match(
    source,
    /https:\/\/translate\.google\.com\/translate_a\/element\.js\?cb=googleTranslateElementInit/,
  );
  assert.match(source, /window\.googleTranslateElementInit/);
  assert.match(source, /__NABLA_GOOGLE_TRANSLATE_STARTED/);
});
