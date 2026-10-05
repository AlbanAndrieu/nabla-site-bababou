import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const CANONICAL_CONTACT_EMAIL = "aa@bababou.com";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("shared widgets use the canonical public contact address", async () => {
  const source = await read("../public/site-widgets.js");

  assert.match(source, /DEFAULT_CONTACT_EMAIL = "aa@bababou\.com"/);
  assert.doesNotMatch(source, /var user = "alban"/);
  assert.doesNotMatch(source, /var domain = "bababou"/);
  assert.match(source, /var email = DEFAULT_CONTACT_EMAIL/);
});

test("inactive Axeptio links are removed by the shared widget runtime", async () => {
  const source = await read("../public/site-widgets.js");

  assert.match(source, /function axeptioEnabled\(\)/);
  assert.match(source, /function initCookiePreferencesLinks\(\)/);
  assert.ok(
    source.includes(
      `querySelectorAll('a[href="javascript:openAxeptioCookies()"]')`,
    ),
  );
  assert.match(
    source,
    /initContactEmailLink\(\);\s+initCookiePreferencesLinks\(\);\s+initAxeptio\(\);/,
  );
});

test("project support documentation no longer publishes the retired address", async () => {
  const retiredAddress = `${["alban", "andrieu"].join(".")}@bababou.com`;
  const paths = [
    "../.github/vercel-deployment-instructions.md",
    "../.github/github-actions-best-practices.md",
  ];

  for (const relativePath of paths) {
    const source = await read(relativePath);
    assert.ok(!source.toLowerCase().includes(retiredAddress), relativePath);
    if (/@bababou\.com/i.test(source)) {
      assert.ok(source.includes(CANONICAL_CONTACT_EMAIL), relativePath);
    }
  }
});
