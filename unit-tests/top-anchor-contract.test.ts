import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Next top anchor matches the #top URL contract", async () => {
  const source = await readFile(
    new URL("../components/TopAnchor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /id=["']top["']/);
  assert.match(source, /data-role=["']top-anchor["']/);
  assert.doesNotMatch(source, /useId/);
});

test("back-to-top navigation writes the same stable hash", async () => {
  const source = await readFile(
    new URL("../components/BackToTopButton.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /#top/);
});
