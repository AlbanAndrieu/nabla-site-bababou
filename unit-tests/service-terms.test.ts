import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routing } from "../i18n/routing.ts";
import {
  getServiceTermsCopy,
  SERVICE_TERMS_EMAIL,
} from "../lib/serviceTerms.ts";

const EXPECTED_LAW_MARKERS = {
  fr: /droit français/i,
  en: /French law/i,
  de: /französischem Recht/i,
  no: /fransk rett/i,
} as const;

test("service terms are native and complete in every first-class locale", () => {
  assert.equal(SERVICE_TERMS_EMAIL, "aa@bababou.com");

  for (const locale of routing.locales) {
    const copy = getServiceTermsCopy(locale);
    const serialized = JSON.stringify(copy);

    assert.equal(copy.sections.length, 16);
    assert.match(serialized, EXPECTED_LAW_MARKERS[locale]);
    assert.match(serialized, /La Défense/);
    assert.doesNotMatch(serialized, /\[(?:CITY|COUNTRY)/i);
    assert.doesNotMatch(serialized, /alban\.andrieu@bababou\.com/i);
  }
});

test("service terms route renders the native locale-aware component", async () => {
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(route, /ServiceTermsContent/);
  assert.match(route, /policy === "service_terms"/);
  assert.match(route, /lang=\{nativePolicy \? locale : page\.contentLanguage\}/);
  assert.match(route, /localizedPolicyAlternates/);
});

test("published Bababou contact sources do not retain the retired address", async () => {
  const retiredAddress = ["alban", "andrieu"].join(".") + "@bababou.com";
  const paths = [
    "../public/index.html",
    "../public/ca/index.html",
    "../public/policy/legal.html",
    "../public/policy/privacy_policy.html",
    "../public/policy/service_terms.html",
    "../messages/email/fr.json",
    "../messages/email/en.json",
    "../messages/email/de.json",
    "../messages/email/no.json",
  ];

  for (const relativePath of paths) {
    const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(
      source,
      new RegExp(retiredAddress.replace(".", "\\."), "i"),
      relativePath,
    );
  }
});
