import type { Metadata } from "next";

import { type AppLocale, routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  pageAlternates,
  type SitePageSlug,
} from "@/lib/sitePageCatalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bababou.com";
const SOCIAL_IMAGE_PATH = "/assets/miss-and-love-you-quote.jpeg";
const TWITTER_CREATOR = "@AlbanAndrieu";

const SITE_COPY = {
  fr: {
    title: "Bababou — Messages, contact et histoire familiale",
    description:
      "Site familial créé par le père de Bababou pour préserver des messages, faciliter la reprise de contact et documenter l’histoire familiale.",
    imageAlt: "Un message affectueux du père de Bababou à sa fille.",
  },
  en: {
    title: "Bababou — Family messages, contact and history",
    description:
      "A family site created by Bababou’s father to preserve messages, make reconnection easier and document the family story.",
    imageAlt: "A heartfelt message from Bababou’s father to his daughter.",
  },
  de: {
    title: "Bababou — Familiennachrichten, Kontakt und Geschichte",
    description:
      "Eine Familienwebsite, auf der Bababous Vater Nachrichten bewahrt, die Kontaktaufnahme erleichtert und die Familiengeschichte dokumentiert.",
    imageAlt: "Eine liebevolle Nachricht von Bababous Vater an seine Tochter.",
  },
  no: {
    title: "Bababou — Familiemeldinger, kontakt og historie",
    description:
      "Et familienettsted der Bababous far tar vare på meldinger, gjør det lettere å ta kontakt igjen og dokumenterer familiens historie.",
    imageAlt: "En kjærlig melding fra Bababous far til datteren.",
  },
} as const satisfies Record<
  AppLocale,
  { title: string; description: string; imageAlt: string }
>;

const OPEN_GRAPH_LOCALE = {
  fr: "fr_FR",
  en: "en_US",
  de: "de_DE",
  no: "nb_NO",
} as const satisfies Record<AppLocale, string>;

function siteCopy(locale: AppLocale) {
  // Social metadata is localized independently of the legacy homepage.
  // The protected homepage content stays owner-controlled until P3 parity.
  return SITE_COPY[locale];
}

function socialMetadata(
  locale: AppLocale,
  title: string,
  description: string,
  url: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const copy = siteCopy(locale);
  const socialImage = new URL(SOCIAL_IMAGE_PATH, SITE_URL).toString();
  const alternateLocale = routing.locales
    .filter((supportedLocale) => supportedLocale !== locale)
    .map((supportedLocale) => OPEN_GRAPH_LOCALE[supportedLocale]);

  return {
    openGraph: {
      type: "website",
      title,
      description,
      url,
      locale: OPEN_GRAPH_LOCALE[locale],
      alternateLocale,
      siteName: "Bababou",
      images: [
        {
          url: socialImage,
          secureUrl: socialImage,
          type: "image/jpeg",
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
  const copy = siteCopy(locale);
  // Legacy homepage is `/` for every locale until its migration is audited.
  const canonical = canonicalPagePath("index", locale);

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
    alternates: { canonical },
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
