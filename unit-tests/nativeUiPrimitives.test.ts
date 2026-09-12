import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("shared actions support semantic outline and compact variants", async () => {
  const [component, styles] = await Promise.all([
    source("components/ui/ActionLink.tsx"),
    source("components/ui/Action.module.css"),
  ]);

  assert.match(component, /ComponentPropsWithoutRef<"a">/);
  assert.match(component, /"primary" \| "secondary" \| "outline"/);
  assert.match(component, /"default" \| "compact"/);
  assert.match(styles, /\.outline\s*\{/);
  assert.match(styles, /\.compact\s*\{/);
  assert.match(styles, /min-height:\s*var\(--ui-control-min-height\)/);
});

test("targeted native routes no longer depend on Bootstrap card/grid/action classes", async () => {
  const [
    email,
    policy,
    policyDetail,
    success,
    cancel,
    contact,
    link,
    testPage,
    checkoutCard,
    legalPolicy,
  ] = await Promise.all([
    source("app/[locale]/email/page.tsx"),
    source("app/[locale]/policy/page.tsx"),
    source("app/[locale]/policy/[policy]/page.tsx"),
    source("app/[locale]/success/page.tsx"),
    source("app/[locale]/cancel/page.tsx"),
    source("app/[locale]/contact/page.tsx"),
    source("app/[locale]/link/page.tsx"),
    source("app/[locale]/test/page.tsx"),
    source("components/CheckoutResultCard.tsx"),
    source("components/policy/LegalPolicyContent.tsx"),
  ]);

  for (const route of [email, policy]) {
    assert.doesNotMatch(route, /className="(?:row|col-|card|btn)/);
    assert.doesNotMatch(route, /bg-body-secondary|shadow-sm/);
  }

  assert.doesNotMatch(policyDetail, /container py-4/);
  assert.match(policyDetail, /ContentLayout\.module\.css/);
  assert.match(policyDetail, /<Container>/);

  for (const route of [success, cancel]) {
    assert.doesNotMatch(route, /className="(?:container py|row|col-|btn)/);
    assert.doesNotMatch(route, /text-success|text-warning/);
    assert.match(route, /ActionLink/);
    assert.match(route, /actionClassName\("outline"\)/);
  }

  assert.doesNotMatch(contact, /btn btn-outline-primary/);
  assert.match(contact, /variant="outline"/);
  assert.match(contact, /size="compact"/);

  for (const route of [link, testPage]) {
    assert.doesNotMatch(route, /className="container py/);
    assert.doesNotMatch(route, /lead text-secondary/);
    assert.match(route, /ContentLayout\.module\.css/);
  }

  assert.doesNotMatch(checkoutCard, /card border-secondary|card-body|display-4/);
  assert.doesNotMatch(legalPolicy, /card card-body|cursor-pointer/);
});

test("native Next runtime does not load Bootstrap while legacy HTML keeps its own dependency", async () => {
  const [layout, legacyHome] = await Promise.all([
    source("app/[locale]/layout.tsx"),
    source("public/index.html"),
  ]);

  assert.doesNotMatch(layout, /bootstrap\/5\.2\.1\/css\/bootstrap\.min\.css/);
  assert.doesNotMatch(layout, /bootstrap-icons\/1\.9\.1/);

  assert.match(legacyHome, /bootstrap\/5\.2\.1\/css\/bootstrap\.min\.css/);
  assert.match(legacyHome, /bootstrap-icons\/1\.9\.1\/font\/bootstrap-icons\.min\.css/);
});

test("shared surface and content layout use semantic design tokens", async () => {
  const [surface, layout] = await Promise.all([
    source("components/ui/Surface.module.css"),
    source("components/ui/ContentLayout.module.css"),
  ]);

  for (const token of [
    "--ui-surface-card",
    "--ui-border",
    "--ui-radius-card",
    "--ui-shadow-sm",
  ]) {
    assert.match(surface, new RegExp(token));
  }

  assert.match(layout, /grid-template-columns:\s*repeat\(2/);
  assert.match(layout, /@media \(max-width: 900px\)/);
  assert.match(layout, /@media \(max-width: 575\.98px\)/);
  assert.match(layout, /grid-template-columns:\s*1fr/);
  assert.match(layout, /\.visuallyHidden/);
});
