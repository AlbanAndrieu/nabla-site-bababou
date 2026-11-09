#!/usr/bin/env node
/**
 * Owner-only local resolver for SITE-DOC identifiers.
 * No network, no OpenRAG access, no file contents, no CI log publication.
 * The identifier is NOT an authorization token or an official case number.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { documentLinkIdentity, publicDocumentLocator } from "../public/document-access-links.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const match = process.argv[2];
if (!/^SITE-DOC-[0-9a-f]{16}$/.test(match ?? "")) {
  process.stderr.write("Usage: node scripts/resolve-site-document-ref.mjs SITE-DOC-0123456789abcdef\n");
  process.exitCode = 2;
} else {
  async function walk(directory) {
    const out = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) out.push(...await walk(child));
      else if (entry.isFile() && /\.(?:html|tsx|pdf|docx?|odt|rtf|xlsx?|ods|pptx?|odp)$/i.test(entry.name)) out.push(child);
    }
    return out;
  }

  let count = 0;
  for (const directory of ["public", "app"]) {
    for (const file of await walk(path.join(root, directory))) {
      const relative = path.relative(root, file).split(path.sep).join("/");
      const pagePath = directory === "public"
        ? "/" + relative.slice("public/".length)
        : "/evidence-access";
      const base = new URL(pagePath, "https://bababou.com").href;
      if (directory === "public" &&
          /\.(?:pdf|docx?|odt|rtf|xlsx?|ods|pptx?|odp)$/i.test(relative)) {
        // Match a publicly shipped asset by its path only. Never read its bytes.
        const identity = documentLinkIdentity(pagePath, base);
        if (identity && publicDocumentLocator(identity) === match) {
          process.stdout.write(`${match} -> shipped public asset: ${relative}\n`);
          count++;
        }
        continue;
      }
      const text = await readFile(file, "utf8");
      const hrefs = [...text.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)];
      for (const raw of hrefs) {
        const identity = documentLinkIdentity(raw[1], base);
        if (identity && publicDocumentLocator(identity) === match) {
          process.stdout.write(`${match} -> source page/code: ${relative}\n`);
          count++;
        }
      }
      // The central-authority archive lists HTML files dynamically in React.
      if (directory === "public" && relative.startsWith("public/ca/") &&
          relative.endsWith(".html") && !relative.endsWith("/index.html")) {
        const identity = documentLinkIdentity(pagePath, base, true);
        if (identity && publicDocumentLocator(identity) === match) {
          process.stdout.write(`${match} -> archived page: ${relative}\n`);
          count++;
        }
      }
    }
  }
  if (!count) {
    process.stderr.write("No static match. Check dynamically generated links locally; no file access is granted.\n");
    process.exitCode = 1;
  }
}
