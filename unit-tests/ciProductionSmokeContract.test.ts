import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

test("production live smoke stays blocking for ordinary internal PRs", () => {
  assert.match(
    workflow,
    /Revalidate canonical production smoke before PR build[\s\S]*?head\.repo\.full_name == github\.repository[\s\S]*?user\.login != 'dependabot\[bot\]'[\s\S]*?verify-production-live\.sh/,
  );
  assert.match(
    workflow,
    /Verify current production baseline before PR build[\s\S]*?verify-production-baseline\.sh/,
  );
});

test("secretless Dependabot and fork PRs defer only the live smoke", () => {
  assert.match(
    workflow,
    /Report unavailable PR production smoke credential context[\s\S]*?user\.login == 'dependabot\[bot\]'[\s\S]*?head\.repo\.full_name != github\.repository/,
  );
  assert.match(
    workflow,
    /Repository secrets are intentionally unavailable in this PR context/,
  );
  assert.match(
    workflow,
    /mandatory production baseline verification above remains enforced/,
  );
});
