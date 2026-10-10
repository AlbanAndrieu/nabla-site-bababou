import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../scripts/agent-p0-check.sh", import.meta.url),
  "utf8",
);

test("P0 stays compact by default with an explicit verbose diagnostic mode", () => {
  assert.match(source, /--verbose/);
  assert.match(source, /P0_LOG_TAIL:-12/);
  assert.match(source, /run_compact_report "P0 Git preflight"/);
  assert.match(source, /NO_COLOR=1 FORCE_COLOR=0/);
  assert.match(source, />"\$\{log\}" 2>&1/);
  assert.match(source, /compact failure summary/);
  assert.match(source, /length\(line\) > 280/);
  assert.match(source, /lines\[matched % max_lines\] = line/);
  assert.match(
    source,
    /start = matched > max_lines \? matched - max_lines : 0/,
  );
  assert.match(source, /print lines\[i % max_lines\]/);
  assert.doesNotMatch(source, /if \(emitted >= max_lines\) exit/);
  assert.match(source, /agent-p0-check\.sh --verbose/);
  assert.doesNotMatch(source, /cat "\$\{log\}"/);
});
