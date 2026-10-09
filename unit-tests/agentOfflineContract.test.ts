import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
  readFile(new URL("../" + path, import.meta.url), "utf8");

test("offline L1 checks every local path without implicit truncation", async () => {
  const [script, justfile] = await Promise.all([
    read("scripts/agent-offline-check.sh"),
    read("justfile"),
  ]);
  assert.match(script, /AGENT_OFFLINE_MAX_PATHS:-0/);
  assert.match(script, /git ls-files --others --exclude-standard/);
  assert.match(script, /git ls-files/);
  assert.match(script, /OFFLINE_BASE_UNAVAILABLE/);
  assert.match(script, /OFFLINE_LIMIT_EXCEEDED/);
  assert.match(script, /bash -n/);
  assert.match(script, /ast\.parse/);
  assert.match(script, /git diff --cached --check/);
  assert.match(script, /NOT_RUN: formatter, Betterleaks/);
  assert.doesNotMatch(script, /head -n|sed -n ['"]1,200|curl |git fetch|git clone/);
  assert.match(justfile, /offline-l1:\n    bash scripts\/agent-offline-check\.sh/);
});
