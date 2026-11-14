import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const COPIED_PROFESSIONAL_PATTERNS = [
  /LinkedIn/i,
  /Docker Hub/i,
  /Stack Exchange/i,
  /DevSecOps/i,
  /albanandrieu\.com/i,
];

test("Next footer uses Bababou routing and localized copy", async () => {
  const footer = await readFile(
    new URL("../app/components/Footer.tsx", import.meta.url),
    "utf8",
  );

  assert.match(footer, /canonicalPagePath\("index", locale\)/);
  assert.match(footer, /canonicalPagePath\("contact", locale\)/);
  assert.match(footer, /\{copyright\}/);
  assert.doesNotMatch(footer, /href="\/(?:eleonore-)?feed\.xml"/);
  assert.match(footer, /href="https:\/\/calendly\.com\/alban-andrieu"/);
  assert.match(footer, /href="https:\/\/github\.com\/AlbanAndrieu\/nabla-site-bababou"/);
  assert.match(footer, /aria-label="Calendly"/);
  assert.match(footer, /aria-label="GitHub"/);
  const ca = await readFile(new URL("../public/ca/demande-explications-autorites-competentes-fr.html", import.meta.url), "utf8");
  for (const href of ["/contact", "https://calendly.com/alban-andrieu", "https://github.com/AlbanAndrieu/nabla-site-bababou"]) {
    assert.ok(ca.includes(`href="${href}"`), href);
  }

  for (const pattern of COPIED_PROFESSIONAL_PATTERNS) {
    assert.doesNotMatch(footer, pattern);
  }
});

test("locale layout uses generated LayoutProps and supplies footer translations", async () => {
  const layout = await readFile(
    new URL("../app/[locale]/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.match(layout, /LayoutProps<"\/\[locale\]">/);
  assert.match(layout, /getMessages\(\{ locale \}\)/);
  assert.match(layout, /contactLabel=\{contactPage\.information\.title\}/);
  assert.match(layout, /copyright=\{copyright\}/);
  assert.doesNotMatch(layout, /rssFeedAria=\{site\.rssFeedAria\}/);
});

test("obsolete duplicate SiteFooter implementations stay removed", async () => {
  await assert.rejects(access(new URL("../components/SiteFooter.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/components/SiteFooter.tsx", import.meta.url)));
});
