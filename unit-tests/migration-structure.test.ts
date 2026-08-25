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

test("keeps base catalogs and composes migrated domain catalogs explicitly", async () => {
  const [requestConfig, messageLoader, englishMessages, frenchMessages] =
    await Promise.all([
      readFile(new URL("../i18n/request.ts", import.meta.url), "utf8"),
      readFile(new URL("../i18n/messages.ts", import.meta.url), "utf8"),
      readFile(new URL("../messages/en.json", import.meta.url), "utf8"),
      readFile(new URL("../messages/fr.json", import.meta.url), "utf8"),
    ]);

  assert.match(requestConfig, /loadMessages/);
  assert.match(messageLoader, /BASE_LOADERS/);
  assert.match(messageLoader, /CONTACT_LOADERS/);
  assert.match(messageLoader, /MIGRATED_BASE_NAMESPACES/);
  assert.doesNotMatch(`${requestConfig}\n${messageLoader}`, /messages\/migration/);
  assert.doesNotThrow(() => JSON.parse(englishMessages));
  assert.doesNotThrow(() => JSON.parse(frenchMessages));
});

test("contact domain catalogs have matching top-level namespace ownership", async () => {
  const [englishContact, frenchContact] = await Promise.all([
    readFile(new URL("../messages/contact/en.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/contact/fr.json", import.meta.url), "utf8"),
  ]);

  const en = JSON.parse(englishContact) as Record<string, unknown>;
  const fr = JSON.parse(frenchContact) as Record<string, unknown>;

  assert.deepEqual(Object.keys(en), ["contactPage"]);
  assert.deepEqual(Object.keys(fr), ["contactPage"]);
});
