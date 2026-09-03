import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getLegalPolicyCopy,
  IMPRESSUM_LAST_UPDATED,
} from "../lib/legalPolicies.ts";

const LOCALES = ["fr", "en", "de", "no"] as const;
const DDG_SECTION_5_URL = "https://www.gesetze-im-internet.de/ddg/__5.html";

test("impressum uses the current German DDG information-duty reference", async () => {
  const component = await readFile(
    new URL("../components/policy/LegalPolicyContent.tsx", import.meta.url),
    "utf8",
  );

  assert.equal(IMPRESSUM_LAST_UPDATED, "2026-09-03");
  assert.match(component, new RegExp(DDG_SECTION_5_URL.replaceAll(".", "\\.")));
  assert.doesNotMatch(component, /gesetze-im-internet\.de\/tmg/);
  assert.doesNotMatch(component, /\{tmg\}/);

  for (const locale of LOCALES) {
    const copy = getLegalPolicyCopy("impressum", locale);
    const intro = copy.intro.join(" ");

    assert.equal(copy.lastUpdated, IMPRESSUM_LAST_UPDATED);
    assert.match(intro, /\{ddg\}/);
    assert.doesNotMatch(intro, /\{tmg\}|Telemediengesetz/);
  }
});
