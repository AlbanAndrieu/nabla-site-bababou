#!/usr/bin/env node
// Contrôle local léger : deux vues du même backlog, références documentaires
// et scripts existants. Aucune connexion réseau, donnée privée ou mutation.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const files = [
  "README.md",
  "docs/operations.md",
  "docs/roadmap.md",
  "docs/engineering-roadmap.md",
  "docs/script-ownership.md",
  "docs/archive/roadmap-through-2026-11-13.md",
];
const errors = [];
for (const file of files) {
  if (!existsSync(resolve(root, file))) errors.push(`Fichier absent : ${file}`);
}
if (errors.length === 0) {
  const read = (file) => readFileSync(resolve(root, file), "utf8");
  const roadmap = read("docs/roadmap.md");
  const engineering = read("docs/engineering-roadmap.md");
  const scripts = read("docs/script-ownership.md");
  const readme = read("README.md");
  const operations = read("docs/operations.md");

  const ids = [...roadmap.matchAll(/^\| \*\*(BB-\d{2})\*\* \|/gm)].map((m) => m[1]);
  const engineeringIds = [...engineering.matchAll(/^\| (BB-\d{2}) \|/gm)].map((m) => m[1]);
  const unique = new Set(ids);
  if (ids.length === 0 || unique.size !== ids.length) errors.push("IDs BB-xx absents ou dupliqués dans la roadmap générale");
  if (engineeringIds.length !== new Set(engineeringIds).size) errors.push("IDs techniques dupliqués");
  for (const id of ids) {
    if (!engineeringIds.includes(id)) errors.push(`Critère technique manquant : ${id}`);
  }
  for (const id of engineeringIds) {
    if (!unique.has(id)) errors.push(`Backlog technique orphelin : ${id}`);
  }
  if (!roadmap.includes("(engineering-roadmap.md)") || !engineering.includes("(roadmap.md)")) {
    errors.push("Liens réciproques des deux roadmaps manquants");
  }
  if (!readme.includes("docs/engineering-roadmap.md") || !readme.includes("docs/script-ownership.md")) {
    errors.push("Index README incomplet");
  }
  if (!operations.includes("engineering-roadmap.md") || !operations.includes("script-ownership.md")) {
    errors.push("Runbook opérations non relié aux références canoniques");
  }
  const mentioned = [...scripts.matchAll(/`(scripts\/[A-Za-z0-9_.\/-]+)`/g)].map((m) => m[1]);
  for (const path of new Set(mentioned)) {
    if (!existsSync(resolve(root, path))) errors.push(`Script documenté absent : ${path}`);
  }
  if (errors.length === 0) console.log(`DOCS_ROADMAP_OK: ${ids.length} sujets reconciliés, ${new Set(mentioned).size} scripts documentés`);
}
if (errors.length > 0) {
  for (const error of errors) console.error(`DOCS_ROADMAP_FAIL: ${error}`);
  process.exitCode = 1;
}
