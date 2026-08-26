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
    /property="og:image" content="https:\/\/bababou\.com\/assets\/miss-and-love-you-quote\.png"/,
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

test("Next layout provides localized Open Graph without exposing the index-only identity", async () => {
  const source = await readFile(
    new URL("../app/[locale]/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /SOCIAL_IMAGE_PATH/);
  assert.match(source, /openGraphLocale: "fr_FR"/);
  assert.match(source, /openGraphLocale: "en_US"/);
  assert.match(source, /alternateLocale/);
  assert.match(source, /siteName: "Bababou"/);
  assert.match(source, /secureUrl: socialImage/);
  assert.match(source, /type: "image\/png"/);
  assert.match(source, /creator: TWITTER_CREATOR/);
  assert.match(source, /images: \[\{ url: socialImage, alt: metadata\.imageAlt \}\]/);
  assert.doesNotMatch(source, /Éléonore|Eleonore|Elenore/);
});
