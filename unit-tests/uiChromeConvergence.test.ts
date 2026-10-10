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
    contentLayout,
    globals,
    accessibility,
  ] = await Promise.all([
    readFile(new URL("../app/design-tokens.css", import.meta.url), "utf8"),
    readFile(new URL("../components/RouteHeader.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/RouteHeader.module.css", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/Footer.module.css", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../components/ContactHero.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/ContactHero.module.css", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/ui/ContentLayout.module.css", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/accessibility.css", import.meta.url), "utf8"),
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
  assert.match(routeHeader, /lang=\{supportedLocale\}/);
  assert.match(routeHeader, /parts\[parts\.length - 1\]\.replace/);
  assert.doesNotMatch(routeHeader, /parts\.map\(\(part\) => part\.replace/);
  assert.match(
    routeHeader,
    /routing\.locales\.some\(\(supported\) => supported === nextLocale\)/,
  );
  assert.match(routeHeader, /aria-label=\{t\("switchLanguage"\)\}/);
  assert.doesNotMatch(routeHeader, /form-select|route-header__/);
  assert.match(routeStyles, /min-height:\s*var\(--ui-control-min-height\)/);
  assert.match(routeStyles, /@media \(max-width:\s*900px\)/);
  assert.match(routeStyles, /@media \(max-width:\s*575\.98px\)/);
  assert.match(routeStyles, /flex-basis:\s*100%/);
  assert.match(routeStyles, /overflow-wrap:\s*anywhere/);
  assert.match(routeStyles, /focus-visible/);

  assert.match(footer, /styles\.socialLink/);
  assert.match(footer, /styles\.copyright/);
  assert.match(footer, /canonicalPagePath\("contact", locale\)/);
  assert.match(footerStyles, /--ui-chrome-surface/);
  assert.match(footerStyles, /padding:\s*clamp\(/);
  assert.match(footerStyles, /min-height:\s*var\(--ui-control-min-height\)/);
  assert.match(footerStyles, /overflow-wrap:\s*anywhere/);
  assert.match(footerStyles, /focus-visible/);

  assert.match(contactHero, /ContactHero\.module\.css/);
  assert.match(contactHero, /styles\.primaryCta/);
  assert.doesNotMatch(contactHero, /btn btn-|contact-hero|cta-buttons/);
  assert.match(contactStyles, /min-height:\s*var\(--ui-control-min-height\)/);
  assert.match(contactStyles, /padding:\s*clamp\(/);
  assert.match(contactStyles, /max-width:\s*100%/);
  assert.match(contactStyles, /overflow-wrap:\s*anywhere/);
  assert.match(contactStyles, /grid-template-columns:\s*1fr/);
  assert.match(contactStyles, /focus-visible/);

  assert.match(contentLayout, /@media \(max-width:\s*900px\)/);
  assert.match(
    contentLayout,
    /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(contentLayout, /text-wrap:\s*balance/);

  assert.match(
    globals,
    /grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 12rem\), 1fr\)\)/,
  );
  assert.match(globals, /height:\s*clamp\(18rem, 45vw, 28\.125rem\)/);
  assert.match(globals, /@import\s+"\.\/accessibility\.css"/);
  assert.match(accessibility, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.match(accessibility, /animation-duration:\s*0\.01ms\s*!important/);
  assert.match(accessibility, /animation-iteration-count:\s*1\s*!important/);
  assert.match(accessibility, /transition-duration:\s*0\.01ms\s*!important/);
  assert.match(accessibility, /scroll-behavior:\s*auto\s*!important/);
  assert.doesNotMatch(globals, /\.route-header(?:\s|\{|__|--)/);
  assert.doesNotMatch(
    globals,
    /:is\(\.page-contact, \.page-cv\) \.contact-hero/,
  );
});

test("shared container keeps bounded responsive page chrome", async () => {
  const [component, styles] = await Promise.all([
    readFile(
      new URL("../components/ui/Container.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/ui/Container.module.css", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(component, /ComponentPropsWithoutRef<"div">/);
  assert.match(styles, /width:\s*min\(100%, 1200px\)/);
  assert.match(styles, /padding-left:\s*max\(/);
  assert.match(styles, /padding-right:\s*max\(/);
  assert.match(styles, /env\(safe-area-inset-left\)/);
  assert.match(styles, /env\(safe-area-inset-right\)/);
});
