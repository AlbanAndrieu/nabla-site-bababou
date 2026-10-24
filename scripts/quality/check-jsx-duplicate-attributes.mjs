import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sourceDirs = ["app", "components"];

/** TypeScript JSX nodes distinguish adjacent elements, spread props and nested tags. */
export function findDuplicateJsxAttributes(source, fileName = "fixture.tsx") {
  const scriptKind = fileName.endsWith(".jsx") ? ts.ScriptKind.JSX : ts.ScriptKind.TSX;
  const ast = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const findings = [];

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const seen = new Set();
      for (const prop of node.attributes.properties) {
        if (!ts.isJsxAttribute(prop)) continue; // JSX spread is not an explicit duplicate.
        const name = prop.name.getText(ast);
        if (seen.has(name)) {
          const pos = ast.getLineAndCharacterOfPosition(prop.name.getStart(ast));
          findings.push({ file: fileName, line: pos.line + 1, column: pos.character + 1, name });
        }
        seen.add(name);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return findings;
}

function listJsxFiles(folder) {
  const files = [];
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    const absolute = join(folder, item.name);
    if (item.isDirectory()) files.push(...listJsxFiles(absolute));
    else if (item.isFile() && /\.[jt]sx$/.test(item.name)) files.push(absolute);
  }
  return files;
}

export function inspectProject(projectRoot = root) {
  const findings = [];
  let count = 0;
  for (const folder of sourceDirs) {
    for (const absolute of listJsxFiles(join(projectRoot, folder))) {
      count += 1;
      const fileName = relative(projectRoot, absolute).replaceAll("\\", "/");
      findings.push(...findDuplicateJsxAttributes(readFileSync(absolute, "utf8"), fileName));
    }
  }
  return { findings, count };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { findings, count } = inspectProject();
  for (const { file, line, column, name } of findings) {
    console.error(file + ":" + line + ":" + column + ": duplicate JSX attribute '" + name + "' (TS17001)");
  }
  if (findings.length) process.exitCode = 1;
  else console.log("JSX attributes: " + count + " files checked, no duplicates");
}
