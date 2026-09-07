import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("shared Next chrome uses semantic tokens and scoped styles", async () => {
  const [
    tokens,
    routeHeader,
    routeStyles,
    footer,
    footerStyles,
    contactHero,
    contactStyles,
    globals,
  ] = await Promise.all([
    readFile(new URL("../app/design-tokens.css", import.meta.url), "utf8"),
    readFile(new URL("../components/RouteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/RouteHeader.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/Footer.module.css", import.meta.url), "utf8"),
    readFile(new URL("../components/ContactHero.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ContactHero.module.css", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  for (const token of [
    "--ui-surface",
    "--ui-text-primary",
    "--ui-border",
    "--ui-chrome-surface",
    "--ui-radius-card",
    "--ui-shadow-sm",
  ]) {
    assert.match(tokens, new RegExp(token));
  }
  assert.match(tokens, /--ui-control-min-height:\s*2\.75rem/);

  assert.match(routeHeader, /components\/ui\/Container/);
  assert.match(routeHeader, /RouteHeader\.module\.css/);
  assert.match(routeHeader, /routing\.locales\.map/);
  assert.doesNotMatch(routeHeader, /form-select|route-header__/);
  assert.match(routeStyles, /min-height:\s*var\(--ui-control-min-height\)/);
  assert.match(routeStyles, /focus-visible/);

  assert.match(footer, /styles\.socialLink/);
  assert.match(footer, /styles\.copyright/);
  assert.match(footer, /canonicalPagePath\("contact", locale\)/);
  assert.match(footerStyles, /--ui-chrome-surface/);
  assert.match(footerStyles, /focus-visible/);

  assert.match(contactHero, /ContactHero\.module\.css/);
  assert.match(contactHero, /styles\.primaryCta/);
  assert.doesNotMatch(contactHero, /btn btn-|contact-hero|cta-buttons/);
  assert.match(contactStyles, /min-height:\s*var\(--ui-control-min-height\)/);
  assert.match(contactStyles, /focus-visible/);

  assert.doesNotMatch(globals, /\.route-header(?:\s|\{|__|--)/);
  assert.doesNotMatch(
    globals,
    /:is\(\.page-contact, \.page-cv\) \.contact-hero/,
  );
});

test("shared container keeps bounded responsive page chrome", async () => {
  const [component, styles] = await Promise.all([
    readFile(new URL("../components/ui/Container.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ui/Container.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /ComponentPropsWithoutRef<"div">/);
  assert.match(styles, /width:\s*min\(100%, 1200px\)/);
  assert.match(styles, /padding-inline:\s*clamp\(/);
});
