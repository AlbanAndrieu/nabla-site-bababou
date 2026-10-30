import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL("../"+path, import.meta.url),"utf8");

test("approved policy hrefs still come from one canonical registry", () => {
  const src=read("components/home/LegacyFooterSection.tsx");
  for(const slug of ["service_terms","privacy_policy","impressum","accessibility_statement","cookie_policy"]) {
    assert.ok(src.includes(`POLICY_PAGES.${slug}.canonicalPath`),slug);
  }
  assert.equal((src.match(/href: POLICY_PAGES\./g)||[]).length,5);
});

test("shared policy navigation has one named section and one shared footer", () => {
  const src=read("components/home/LegacyFooterSection.tsx");
  assert.match(src, /<section id="preview-footer"/);
  assert.match(src, /aria-labelledby="preview-policies-heading"/);
  assert.match(src, /<nav aria-label=\{t\.nav\}>/);
  assert.doesNotMatch(src, /<footer\b/);
  assert.match(read("app/components/Footer.tsx"), /<BackToTopButton/);
});

test("FR EN DE NO policy labels are native and accessible", () => {
  const src=read("components/home/LegacyFooterSection.tsx");
  for(const word of ["Mentions et politiques","Site Policies","Rechtliche Hinweise","Nettstedets retningslinjer",
    "Conditions d’utilisation","Terms of Use","Nutzungsbedingungen","Bruksvilkår"]) {
    assert.ok(src.includes(word),word);
  }
  assert.match(src,/lang=\{locale\}/);
  assert.match(src,/aria-label=\{t\.nav\}/);
});

test("responsive policy links have keyboard focus and touch targets", () => {
  const css=read("components/home/LegacyFooterSection.module.css");
  assert.match(css,/flex-wrap: wrap/);
  assert.match(css,/min-height: 2\.75rem/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/touch-action: manipulation/);
});
