import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const slugs = [
  "service_terms",
  "privacy_policy",
  "impressum",
  "accessibility_statement",
  "cookie_policy",
];

test("all approved policy links use the canonical route registry", () => {
  const source = read("components/home/LegacyFooterSection.tsx");
  assert.match(source, /import \{ POLICY_PAGES \} from "@\/lib\/policyPages"/);
  for (const slug of slugs) {
    assert.ok(source.includes(`POLICY_PAGES.${slug}.canonicalPath`), slug);
  }
  assert.equal((source.match(/href: POLICY_PAGES\./g) ?? []).length, slugs.length);
  assert.doesNotMatch(source, /href="\/policy\/[^"\s]*\.html"/);
});

test("legal navigation is a named section inside main, not a second footer", () => {
  const source = read("components/home/LegacyFooterSection.tsx");
  assert.match(source, /<section\s/);
  assert.match(source, /aria-labelledby="preview-policies-heading"/);
  assert.match(source, /id="preview-policies-heading"/);
  assert.match(source, /Mentions et politiques du site/);
  assert.match(source, /Site Policies/);
  assert.match(source, /Legal and accessibility links/);
  assert.match(source, /Liens juridiques et accessibilité/);
  assert.match(source, /<ul className=\{styles\.links\}>/);
  assert.match(source, /<li key=\{href\}>/);
  assert.doesNotMatch(source, /<footer\b/);
});

test("policy links preserve legacy English labels and back-to-top navigation", () => {
  const source = read("components/home/LegacyFooterSection.tsx");
  for (const label of ["Terms of Use", "Privacy Policy", "Impressum", "Accessibility", "Cookie Policy"]) {
    assert.ok(source.includes(`label: "${label}"`), label);
  }
  assert.match(source, /lang=\{locale === "fr" \? "fr" : "en"\}/);
  assert.match(source, /Conditions d’utilisation/);
  assert.match(source, /Politique de confidentialité/);
  assert.doesNotMatch(source, /href="#main-content"/);
  assert.match(read("app/components/Footer.tsx"), /<BackToTopButton/);
});

test("policy links have keyboard focus, hover and responsive touch targets", () => {
  const css = read("components/home/LegacyFooterSection.module.css");
  assert.match(css, /flex-wrap: wrap/);
  assert.match(css, /min-height: 2\.75rem/);
  assert.match(css, /\.section a:focus-visible/);
  assert.match(css, /\.section a:hover/);
  assert.match(css, /touch-action: manipulation/);
  assert.doesNotMatch(css, /transition:\s*all\b|outline:\s*none\b/);
});
