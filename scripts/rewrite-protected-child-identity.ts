import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { replaceProtectedIdentity } from "./privacy-identities.ts";

const files = process.argv.slice(2);
if (!files.length) {
  throw new Error("Usage: rewrite-protected-child-identity.ts <file> [...file]");
}

for (const file of files) {
  const absolute = path.resolve(file);
  const source = await readFile(absolute, "utf8");
  const rewritten = replaceProtectedIdentity(source, "Bababou");
  if (rewritten !== source) {
    await writeFile(absolute, rewritten, "utf8");
    console.log(`Rewrote protected child identity in ${file}`);
  } else {
    console.log(`No protected child identity found in ${file}`);
  }
}
