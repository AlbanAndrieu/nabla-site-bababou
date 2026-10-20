import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("Copilot root instructions stay thin and defer to canonical repository policy", async () => {
  const instructions = await read("../.github/copilot-instructions.md");

  assert.ok(
    Buffer.byteLength(instructions, "utf8") < 5000,
    "root Copilot instructions must stay compact",
  );
  assert.match(instructions, /AGENTS\.md/);
  assert.match(instructions, /just quality-fix/);
  assert.match(instructions, /just publish/);
  assert.match(instructions, /QG_AUTOFIX_REQUIRED/);
  assert.match(instructions, /copilot-instructions-nextjs\.md/);
  assert.match(instructions, /copilot-instructions-cicd\.md/);
  assert.doesNotMatch(instructions, /NEXT-AGENTS-MD-START/);
});

test("Copilot setup installs repository hooks and keys pre-commit cache to all hook inputs", async () => {
  const workflow = await read("../.github/workflows/copilot-setup-steps.yml");

  assert.match(workflow, /\.pre-commit-pre-push\.yaml/);
  assert.match(workflow, /pre-commit-v4\.6\.2-/);
  assert.match(
    workflow,
    /hashFiles\('\.pre-commit-config\.yaml', '\.pre-commit-pre-push\.yaml', '\.python-version', '\.nvmrc'\)/,
  );
  assert.match(workflow, /pre-commit install --hook-type pre-commit/);
  assert.match(workflow, /pre-commit install --config \.pre-commit-pre-push\.yaml --hook-type pre-push/);
  assert.doesNotMatch(workflow, /--hook-type commit-msg/);
});
