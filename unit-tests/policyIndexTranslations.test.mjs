import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const locales = ["fr", "en", "de", "no"];
const fields = ["metadataTitle", "metadataDescription", "heading", "intro", "open"];

test("policy index catalogs preserve nonempty localized metadata and UI fields", () => {
  for (const locale of locales) {
    const data = JSON.parse(read("messages/policy-index/" + locale + ".json"));
    assert.deepEqual(Object.keys(data), ["policyIndexPage"]);
    assert.deepEqual(Object.keys(data.policyIndexPage), fields);
    for (const [field, value] of Object.entries(data.policyIndexPage)) {
      assert.equal(typeof value, "string", locale + "." + field);
      assert.ok(value.trim().length > 0, locale + "." + field);
      assert.doesNotMatch(value, /<script|javascript:/i, locale + "." + field);
    }
  }
});

test("the shared message loader includes exactly one policy index namespace", () => {
  const loader = read("i18n/messages.ts");
  const page = read("app/[locale]/policy/page.tsx");
  assert.match(loader, /POLICY_INDEX_LOADERS\[locale\]\(\)/);
  assert.match(loader, /policyIndex,/);
  assert.match(loader, /assertUniqueTopLevelNamespaces\(catalogs\)/);
  assert.equal((page.match(/namespace: "policyIndexPage"/g) ?? []).length, 2);
  assert.doesNotMatch(page, /POLICY_INDEX_COPY/);
  assert.match(page, /t\("metadataTitle"\)/);
  assert.match(page, /t\("metadataDescription"\)/);
  assert.match(page, /t\("heading"\)/);
  assert.match(page, /t\("intro"\)/);
  assert.match(page, /t\("open"\)/);
});
