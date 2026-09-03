import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  getPublicPolicyCopy,
  PUBLIC_POLICY_LAST_UPDATED,
} from "../lib/publicPolicies.ts";

const LOCALES = ["fr", "en", "de", "no"] as const;
const POLICIES = ["cookie_policy", "accessibility_statement"] as const;
const TOKEN_PATTERN = /\{(privacy|home|wcag|defender)\}/;

test("remaining public policies provide complete first-class locale copy", () => {
  assert.equal(PUBLIC_POLICY_LAST_UPDATED, "2026-09-03");

  for (const policy of POLICIES) {
    for (const locale of LOCALES) {
      const copy = getPublicPolicyCopy(policy, locale);

      assert.equal(copy.lastUpdated, PUBLIC_POLICY_LAST_UPDATED);
      assert.ok(copy.metadataTitle.trim().length > 0);
      assert.ok(copy.metadataDescription.trim().length > 0);
      assert.ok(copy.title.trim().length > 0);
      assert.ok(copy.intro.length > 0);
      assert.equal(copy.sections.length, 5);

      const text = [
        ...copy.intro,
        ...copy.sections.flatMap((section) => [
          ...(section.paragraphs ?? []),
          ...(section.items ?? []).map((item) => item.text),
        ]),
        ...(copy.closing ?? []),
      ].join(" ");
      const tokens = [...text.matchAll(/\{[^}]+\}/g)].map((match) => match[0]);

      for (const token of tokens) {
        assert.match(token, TOKEN_PATTERN);
      }
    }
  }
});

test("canonical cookie copy reflects the current Next analytics and consent runtime", async () => {
  const source = await readFile(
    new URL("../lib/publicPolicies.ts", import.meta.url),
    "utf8",
  );
  const english = getPublicPolicyCopy("cookie_policy", "en");
  const text = [
    ...english.intro,
    ...english.sections.flatMap((section) => [
      ...(section.paragraphs ?? []),
      ...(section.items ?? []).map((item) => item.text),
    ]),
    ...(english.closing ?? []),
  ].join(" ");

  assert.match(text, /Vercel Web Analytics and Speed Insights/);
  assert.match(text, /Not every site surface necessarily exposes a cookie manager/);
  assert.doesNotMatch(source, /openAxeptioCookies/);
  assert.doesNotMatch(source, /Axeptio/);
});

test("accessibility copy preserves the reviewed WCAG 2.1 target without overstating compliance", () => {
  for (const locale of LOCALES) {
    const copy = getPublicPolicyCopy("accessibility_statement", locale);
    const text = [
      ...copy.intro,
      ...copy.sections.flatMap((section) => [
        ...(section.paragraphs ?? []),
        ...(section.items ?? []).map((item) => item.text),
      ]),
      ...(copy.closing ?? []),
    ].join(" ");

    assert.match(text, /\{wcag\}/);
  }

  const english = getPublicPolicyCopy("accessibility_statement", "en");
  assert.match(english.links.wcag, /WCAG.*2\.1/);
  assert.match(english.sections[0].paragraphs?.[0] ?? "", /where practicable/);
});
