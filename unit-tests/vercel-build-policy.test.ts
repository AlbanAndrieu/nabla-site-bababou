import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const vercelConfigUrl = new URL("../vercel.json", import.meta.url);

test("Vercel skips only semantic-release metadata commits", async () => {
  const config = JSON.parse(await readFile(vercelConfigUrl, "utf8")) as {
    ignoreCommand?: string;
  };

  assert.equal(
    config.ignoreCommand,
    "git log -1 --pretty=%s | grep -Eq '^chore\\(release\\): [0-9]+\\.[0-9]+\\.[0-9]+ \\[skip ci\\]$'",
  );
});
