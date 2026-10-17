import assert from "node:assert/strict";
import test from "node:test";

import {
  localizedPageMetadata,
  localizedSiteMetadata,
} from "../lib/siteSocialMetadata.ts";

const locales = {
  fr: { og: "fr_FR", title: "Messages", alt: "affectueux" },
  en: { og: "en_US", title: "Family", alt: "heartfelt" },
  de: { og: "de_DE", title: "Familiennachrichten", alt: "liebevolle" },
  no: { og: "nb_NO", title: "Familiemeldinger", alt: "kjærlig" },
} as const;

for (const [locale, expected] of Object.entries(locales) as Array<
  [keyof typeof locales, (typeof locales)[keyof typeof locales]]
>) {
  test(`social metadata for ${locale} uses reviewed localized copy`, () => {
    const metadata = localizedSiteMetadata(locale);
    const title = metadata.title;
    assert.ok(title && typeof title === "object" && "absolute" in title);
    assert.match(String(title.absolute), new RegExp(expected.title, "i"));
    assert.equal(metadata.openGraph?.locale, expected.og);
    assert.ok(metadata.description);
    assert.equal(metadata.openGraph?.description, metadata.description);
    assert.equal(metadata.twitter?.description, metadata.description);
    assert.equal(metadata.openGraph?.url, "/");
    assert.equal(metadata.alternates?.canonical, "/");

    const images = metadata.openGraph?.images;
    assert.ok(Array.isArray(images) && images.length === 1);
    const image = images[0];
    assert.ok(typeof image === "object" && "alt" in image);
    assert.match(String(image.alt), new RegExp(expected.alt, "i"));
  });
}

test("native localized page keeps canonical, hreflang and social URL aligned", () => {
  const metadata = localizedPageMetadata(
    "contact",
    "de",
    "Kontakt",
    "Kontakt mit der Familie",
  );
  assert.equal(metadata.alternates?.canonical, "/de/contact");
  assert.equal(metadata.openGraph?.url, "/de/contact");
  assert.equal(metadata.openGraph?.locale, "de_DE");
  assert.equal(metadata.twitter?.title, "Kontakt");
  assert.deepEqual(metadata.alternates?.languages, {
    fr: "/contact",
    en: "/en/contact",
    de: "/de/contact",
    no: "/no/contact",
    "x-default": "/contact",
  });
});

test("every localized native contact URL stays aligned with OpenGraph and hreflang", () => {
  for (const [locale, { og }] of Object.entries(locales) as Array<
    [keyof typeof locales, (typeof locales)[keyof typeof locales]]
  >) {
    const metadata = localizedPageMetadata(
      "contact",
      locale,
      "Contact",
      "Localized contact page",
    );
    const canonical = locale === "fr" ? "/contact" : `/${locale}/contact`;
    assert.equal(metadata.alternates?.canonical, canonical);
    assert.equal(metadata.openGraph?.url, canonical);
    assert.equal(metadata.openGraph?.locale, og);
    assert.equal(metadata.twitter?.title, "Contact");
    assert.deepEqual(metadata.alternates?.languages, {
      fr: "/contact",
      en: "/en/contact",
      de: "/de/contact",
      no: "/no/contact",
      "x-default": "/contact",
    });
  }
});
