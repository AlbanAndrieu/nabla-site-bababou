import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

/**
 * Contact/email intentionally preserve Alban's public professional/contact
 * parity (see contact-next-contract.test.ts and the canonical privacy skill).
 * Keep this anti-copy guard focused on Bababou surfaces where portfolio chrome
 * would still be an accidental migration leak.
 */
const PORTFOLIO_FREE_NEXT_FILES = [
  "../app/[locale]/link/page.tsx",
  "../app/[locale]/test/page.tsx",
  "../app/components/Footer.tsx",
] as const;

const COPIED_PORTFOLIO_PATTERNS = [
  /DevSecOps/i,
  /LinkedIn/i,
  /Jus\s*Mundi/i,
  /nabla-site-alban/i,
  /Docker Hub/i,
  /Stack Exchange/i,
  /coffeeFab/i,
];

test("non-contact Next surfaces stay free of copied portfolio chrome", async () => {
  const sources = await Promise.all(
    PORTFOLIO_FREE_NEXT_FILES.map((path) =>
      readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );

  for (const source of sources) {
    for (const pattern of COPIED_PORTFOLIO_PATTERNS) {
      assert.doesNotMatch(source, pattern);
    }
    // Calendly is approved only for the shared Bababou footer.
    if (source !== sources[2]) assert.doesNotMatch(source, /Calendly/i);
  }
});

test("locale layout serializes only shared site messages to client components", async () => {
  const layout = await readFile(
    new URL("../app/[locale]/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.match(layout, /NextIntlClientProvider\s+locale=\{locale\}\s+messages=\{\{ site \}\}/);
  assert.doesNotMatch(layout, /NextIntlClientProvider[^>]*messages=\{messages\}/);
});

test("technical test route stays explicitly non-indexable", async () => {
  const source = await readFile(
    new URL("../app/[locale]/test/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /robots:\s*NON_INDEXABLE_ROBOTS/);
  assert.match(source, /PageProps<"\/\[locale\]\/test">/);
});

test("localized home placeholder cannot escape before P3 migration", async () => {
  const [homePage, routeHeader] = await Promise.all([
    readFile(new URL("../app/[locale]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/RouteHeader.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(homePage, /redirect\("\/"\)/);
  assert.doesNotMatch(homePage, /Bienvenue|Welcome/i);
  assert.match(routeHeader, /canonicalPagePath\("index", locale\)/);
});
