import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../scripts/vercel-ignore-build.sh", import.meta.url),
  "utf8",
);

test("missing previous deployment SHA forces a build", () => {
  assert.match(source, /VERCEL_GIT_PREVIOUS_SHA/);
  assert.match(source, /No verified previous deployment SHA; build/);
  assert.doesNotMatch(source, /falling back to parent commit/);
});

test("preview checkpoints always build at the exact validated ref", () => {
  assert.match(source, /vercel-preview-\*/);
  assert.match(source, /build exact deployment/);
});
