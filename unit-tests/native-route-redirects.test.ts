import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { LEGACY_HTML_REDIRECT_SLUGS } from "../lib/mainContentRoute.mjs";

test("migrated legacy html routes redirect to localized Next canonicals", async () => {
  const source = await readFile(
    new URL("../next.config.mjs", import.meta.url),
    "utf8",
  );

  assert.match(source, /LEGACY_HTML_REDIRECT_SLUGS\.flatMap/);
  for (const slug of [
    "contact",
    "email",
    "link",
    "success",
    "cancel",
    "central-authorities",
    "central-authorities-failures",
  ]) {
    assert.ok(LEGACY_HTML_REDIRECT_SLUGS.includes(slug), slug);
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
