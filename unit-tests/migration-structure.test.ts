import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const EXPECTED_LEGACY_POSTINSTALL =
  "copyfiles -f ./node_modules/d3/d3.min.js ./index/dist/scripts/d3 && copyfiles -f ./app/scripts/arf.js ./dist/scripts/ && copyfiles -f ./app/resources/*.json ./dist/resources && copyfiles -f ./index.html ./dist/ && copyfiles -f ./wireframe.css ./dist/";

test("keeps the legacy postinstall until the dist consumers are audited", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as { scripts?: Record<string, string> };

  assert.equal(packageJson.scripts?.postinstall, EXPECTED_LEGACY_POSTINSTALL);
});

test("loads first-class locale messages directly without a migration catalog", async () => {
  const requestConfig = await readFile(
    new URL("../i18n/request.ts", import.meta.url),
    "utf8",
  );

  assert.match(requestConfig, /\.\.\/messages\/\$\{locale as AppLocale\}\.json/);
  assert.doesNotMatch(requestConfig, /messages\/migration/);
});
