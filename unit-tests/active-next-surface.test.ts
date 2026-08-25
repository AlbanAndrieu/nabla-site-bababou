import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ACTIVE_NEXT_FILES = [
  "../app/[locale]/contact/page.tsx",
  "../app/[locale]/email/page.tsx",
  "../app/[locale]/link/page.tsx",
  "../app/[locale]/test/page.tsx",
  "../app/components/Footer.tsx",
] as const;

const COPIED_PORTFOLIO_PATTERNS = [
  /DevSecOps/i,
  /Calendly/i,
  /LinkedIn/i,
  /Jus\s*Mundi/i,
  /nabla-site-alban/i,
  /Docker Hub/i,
  /Stack Exchange/i,
  /coffeeFab/i,
];

test("active Next surfaces stay free of copied portfolio chrome", async () => {
  const sources = await Promise.all(
    ACTIVE_NEXT_FILES.map((path) =>
      readFile(new URL(path, import.meta.url), "utf8"),
    ),
  );

  for (const source of sources) {
    for (const pattern of COPIED_PORTFOLIO_PATTERNS) {
      assert.doesNotMatch(source, pattern);
    }
  }
});

test("technical test route stays explicitly non-indexable", async () => {
  const source = await readFile(
    new URL("../app/[locale]/test/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /robots:\s*NON_INDEXABLE_ROBOTS/);
  assert.match(source, /PageProps<"\/\[locale\]\/test">/);
});
