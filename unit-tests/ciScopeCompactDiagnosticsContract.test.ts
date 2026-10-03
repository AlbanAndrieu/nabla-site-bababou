import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../unit-tests/ciScope.test.ts", import.meta.url),
  "utf8",
);

test("CI scope contracts fail compactly without dumping workflow bodies", () => {
  assert.match(source, /function assertMatches/);
  assert.match(source, /missing contract:/);
  assert.match(source, /function assertNotMatches/);
  assert.match(source, /unexpected contract:/);
  assert.doesNotMatch(source, /assert\.match\(workflow/);
  assert.doesNotMatch(source, /assert\.doesNotMatch\(workflow/);
});
