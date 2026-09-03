import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("migrated legacy html routes redirect to localized Next canonicals", async () => {
  const source = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  for (const slug of ["contact", "email", "link", "success", "cancel"]) {
    assert.match(source, new RegExp(`"${slug}"`));
  }
  assert.match(
    source,
    /source: `\/\$\{slug\}\.html`, destination: `\/en\/\$\{slug\}`/,
  );
  assert.match(
    source,
    /source: `\/fr\/\$\{slug\}\.html`, destination: `\/\$\{slug\}`/,
  );
  assert.match(source, /permanent: true/);
});
