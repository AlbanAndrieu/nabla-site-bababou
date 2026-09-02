import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routing } from "../i18n/routing.ts";
import {
  getPrivacyPolicyCopy,
  PRIVACY_POLICY_EMAIL,
} from "../lib/privacyPolicy.ts";

const EXPECTED_GDPR_MARKERS = {
  fr: /RGPD/i,
  en: /GDPR/i,
  de: /DSGVO/i,
  no: /GDPR/i,
} as const;

test("privacy policy is native and complete in every first-class locale", () => {
  assert.equal(PRIVACY_POLICY_EMAIL, "aa@bababou.com");

  for (const locale of routing.locales) {
    const copy = getPrivacyPolicyCopy(locale);
    const serialized = JSON.stringify(copy);

    assert.equal(copy.sections.length, 13);
    assert.match(serialized, EXPECTED_GDPR_MARKERS[locale]);
    assert.match(serialized, /La Défense/);
    assert.match(serialized, /\{email\}/);
    assert.match(serialized, /\{cnil\}/);
    assert.doesNotMatch(serialized, /alban\.andrieu@bababou\.com/i);
  }
});

test("privacy policy route renders the native locale-aware component", async () => {
  const route = await readFile(
    new URL("../app/[locale]/policy/[policy]/page.tsx", import.meta.url),
    "utf8",
  );
  const content = await readFile(
    new URL("../components/policy/PrivacyPolicyContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(route, /policy === "privacy_policy"/);
  assert.match(route, /<PrivacyPolicyContent locale=\{locale\} \/>/);
  assert.match(route, /getPrivacyPolicyCopy/);
  assert.match(content, /mailto:\$\{PRIVACY_POLICY_EMAIL\}/);
  assert.match(content, /https:\/\/www\.cnil\.fr\//);
});
