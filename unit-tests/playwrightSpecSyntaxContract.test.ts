import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const testsRoot = join(repositoryRoot, "tests");

async function collectPlaywrightSpecs(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectPlaywrightSpecs(path);
      return entry.isFile() && /\.spec\.[cm]?[jt]sx?$/.test(entry.name)
        ? [path]
        : [];
    }),
  );
  return nested.flat().sort();
}

test("Playwright specs remain syntactically valid without starting browsers", async () => {
  const specs = await collectPlaywrightSpecs(testsRoot);
  assert.ok(specs.length > 0, "expected at least one Playwright spec");

  const diagnostics: string[] = [];
  for (const spec of specs) {
    const source = await readFile(spec, "utf8");
    const result = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
      },
      fileName: spec,
      reportDiagnostics: true,
    });

    for (const diagnostic of result.diagnostics ?? []) {
      if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
      diagnostics.push(
        `${relative(repositoryRoot, spec)}: ${ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n",
        )}`,
      );
    }
  }

  assert.deepEqual(diagnostics, []);
});

test("Playwright syntax guard reports malformed TypeScript", () => {
  const result = ts.transpileModule("const broken = ;", {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
    },
    fileName: "broken.spec.ts",
    reportDiagnostics: true,
  });

  assert.ok(
    (result.diagnostics ?? []).some(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ),
  );
});
