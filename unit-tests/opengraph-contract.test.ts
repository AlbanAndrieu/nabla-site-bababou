import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("legacy homepage keeps the approved identity and complete social metadata", async () => {
  const source = await readFile(
    new URL("../public/index.html", import.meta.url),
    "utf8",
  );

  assert.match(source, /<title>Éléonore \(Bababou\).*Bababou<\/title>/);
  assert.match(source, /property="og:type" content="website"/);
  assert.match(source, /property="og:url" content="https:\/\/bababou\.com\/"/);
  assert.match(source, /property="og:site_name" content="Bababou"/);
  assert.match(source, /property="og:locale" content="en_US"/);
  assert.match(
    source,
    /property="og:title" content="Éléonore \(Bababou\) — Your Father Is Looking for You"/,
  );
  assert.match(
    source,
    /property="og:image" content="https:\/\/bababou\.com\/assets\/miss-and-love-you-quote\.jpeg"/,
  );
  assert.match(source, /property="og:image:type" content="image\/png"/);
  assert.match(source, /property="og:image:alt" content="[^"]+"/);
  assert.match(source, /name="twitter:card" content="summary_large_image"/);
  assert.match(source, /name="twitter:creator" content="@AlbanAndrieu"/);
  assert.match(source, /name="twitter:image:alt" content="[^"]+"/);
  assert.doesNotMatch(source, /name="twitter:[^"]+"\s+value=/i);
  assert.match(
    source,
    /"alternateName": "Éléonore \(Bababou\) — Your Father Is Looking for You"/,
  );
});

test("Next social metadata is centralized and excludes the homepage-only identity", async () => {
  const helper = await readFile(
    new URL("../lib/siteSocialMetadata.ts", import.meta.url),
    "utf8",
  );
  const layout = await readFile(
    new URL("../app/[locale]/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.match(helper, /fr: "fr_FR"/);
  assert.match(helper, /en: "en_US"/);
  assert.match(helper, /de: "de_DE"/);
  assert.match(helper, /no: "nb_NO"/);
  assert.match(helper, /satisfies Record<AppLocale, string>/);
  assert.match(helper, /SITE_COPY\[locale as SiteCopyLocale\] \?\? SITE_COPY\.en/);
  assert.match(helper, /alternateLocale/);
  assert.match(helper, /siteName: "Bababou"/);
  assert.match(helper, /secureUrl: socialImage/);
  assert.match(helper, /type: "image\/jpeg"/);
  assert.match(helper, /creator: TWITTER_CREATOR/);
  assert.match(helper, /localizedPageMetadata/);
  assert.match(layout, /localizedSiteMetadata\(locale\)/);
  assert.doesNotMatch(helper, /Éléonore|Eleonore|Elenore/);
});

test("native Next routes own their page-specific social metadata", async () => {
  for (const route of ["contact", "email", "link"] as const) {
    const source = await readFile(
      new URL(`../app/[locale]/${route}/page.tsx`, import.meta.url),
      "utf8",
    );

    assert.match(source, /localizedPageMetadata\(/);
    assert.doesNotMatch(source, /pageAlternates\(/);
  }
});
