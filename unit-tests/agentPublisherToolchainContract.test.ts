import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("publisher fingerprints only queryable tools", async () => {
  const source = await readFile(
    new URL("../scripts/agent-publish.sh", import.meta.url),
    "utf8",
  );

  assert.match(source, /tool_version_or_fail\(\)/);
  assert.match(source, /QG_PUBLISH_TOOL_MISSING/);
  assert.match(source, /QG_PUBLISH_TOOL_INVALID/);
  assert.match(source, /node_version="\$\(tool_version_or_fail node node --version\)"/);
  assert.match(source, /npm_version="\$\(tool_version_or_fail npm npm --version\)"/);
  assert.match(
    source,
    /precommit_version="\$\(tool_version_or_fail pre-commit pre-commit --version\)"/,
  );
  assert.match(source, /if ! TOOLCHAIN_SHA="\$\(toolchain_fingerprint\)"; then/);
  assert.match(source, /QG_PUBLISH_TOOLCHAIN_INVALID/);
});
