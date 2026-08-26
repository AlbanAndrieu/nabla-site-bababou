import type { Metadata } from "next";

import { type AppLocale, routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  pageAlternates,
  type SitePageSlug,
} from "@/lib/sitePageCatalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bababou.com";
const SOCIAL_IMAGE_PATH = "/assets/miss-and-love-you-quote.png";
const TWITTER_CREATOR = "@AlbanAndrieu";

const SITE_COPY = {
  fr: {
    title: "Bababou — Messages, contact et histoire familiale",
    description:
      "Site familial créé par le père de Bababou pour préserver des messages, faciliter la reprise de contact et documenter l’histoire familiale.",
    openGraphLocale: "fr_FR",
    imageAlt: "Un message affectueux du père de Bababou à sa fille.",
  },
  en: {
    title: "Bababou — Family messages, contact and history",
    description:
      "A family site created by Bababou’s father to preserve messages, make reconnection easier and document the family story.",
    openGraphLocale: "en_US",
    imageAlt: "A heartfelt message from Bababou’s father to his daughter.",
  },
} as const satisfies Record<
  AppLocale,
  {
    title: string;
    description: string;
    openGraphLocale: string;
    imageAlt: string;
  }
>;

function localizedHomePath(locale: AppLocale) {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

function socialMetadata(
  locale: AppLocale,
  title: string,
  description: string,
  url: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const copy = SITE_COPY[locale];
  const socialImage = new URL(SOCIAL_IMAGE_PATH, SITE_URL).toString();
  const alternateLocale = routing.locales
    .filter((supportedLocale) => supportedLocale !== locale)
    .map((supportedLocale) => SITE_COPY[supportedLocale].openGraphLocale);

  return {
    openGraph: {
      type: "website",
      title,
      description,
      url,
      locale: copy.openGraphLocale,
      alternateLocale,
      siteName: "Bababou",
      images: [
        {
          url: socialImage,
          secureUrl: socialImage,
          type: "image/png",
          alt: copy.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: TWITTER_CREATOR,
      images: [{ url: socialImage, alt: copy.imageAlt }],
    },
  };
}

export function localizedSiteMetadata(locale: AppLocale): Metadata {
  const copy = SITE_COPY[locale];
  const canonical = localizedHomePath(locale);
  const languages = Object.fromEntries(
    routing.locales.map((supportedLocale) => [
      supportedLocale,
      localizedHomePath(supportedLocale),
    ]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Bababou",
    title: { absolute: copy.title },
    description: copy.description,
    keywords: ["Bababou", "family", "family messages", "family contact"],
    authors: [{ name: "Alban Andrieu", url: "https://albanandrieu.com" }],
    creator: "Alban Andrieu",
    publisher: "Alban Andrieu",
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical,
      languages,
    },
    ...socialMetadata(locale, copy.title, copy.description, canonical),
  };
}

export function localizedPageMetadata(
  slug: SitePageSlug,
  locale: AppLocale,
  title: string,
  description: string,
): Metadata {
  const canonical = canonicalPagePath(slug, locale);

  return {
    title,
    description,
    alternates: pageAlternates(slug, locale),
    ...socialMetadata(locale, title, description, canonical),
  };
}
