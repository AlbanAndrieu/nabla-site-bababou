import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = resolve(projectRoot, "public");
const vendorRoot = resolve(
  publicRoot,
  "assets/fontawesome-free-7.1.0-web",
);

const retainedVendorFiles = [
  "LICENSE.txt",
  "js/brands.js",
  "js/fontawesome.js",
  "js/solid.js",
] as const;

async function collectFiles(
  root: string,
  options: { skipAssets?: boolean } = {},
): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (
          options.skipAssets &&
          directory === publicRoot &&
          entry.name === "assets"
        ) {
          continue;
        }
        await walk(absolute);
        continue;
      }
      if (entry.isFile()) {
        files.push(relative(root, absolute).replaceAll("\\", "/"));
      }
    }
  }

  await walk(root);
  return files.sort();
}

test("vendored Font Awesome runtime keeps only files consumed by legacy pages", async () => {
  assert.deepEqual(await collectFiles(vendorRoot), retainedVendorFiles);
});

test("legacy text consumers only reference retained Font Awesome runtime JS", async () => {
  const textFiles = (await collectFiles(publicRoot, { skipAssets: true })).filter(
    (path) => path.endsWith(".html") || path.endsWith(".js"),
  );
  const referenced = new Set<string>();
  const prefix = "/assets/fontawesome-free-7.1.0-web/";

  for (const path of textFiles) {
    const source = await readFile(resolve(publicRoot, path), "utf8");
    const pattern =
      /\/assets\/fontawesome-free-7\.1\.0-web\/([^"'?\\s<]+)/g;
    for (const match of source.matchAll(pattern)) {
      referenced.add(match[1]);
    }
  }

  assert.deepEqual(
    [...referenced].sort(),
    ["js/brands.js", "js/fontawesome.js", "js/solid.js"],
  );
});
