import "../design-tokens.css";
import "../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Footer from "@/app/components/Footer";
import RouteHeader from "@/components/RouteHeader";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bababou.com";
const SOCIAL_IMAGE_PATH = "/assets/miss-and-love-you-quote.png";
const TWITTER_CREATOR = "@AlbanAndrieu";
const SITE_METADATA = {
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
} as const;

function localizedCanonical(locale: string): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const metadata = SITE_METADATA[locale];
  const canonical = localizedCanonical(locale);
  const languages = Object.fromEntries(
    routing.locales.map((supportedLocale) => [
      supportedLocale,
      localizedCanonical(supportedLocale),
    ]),
  );
  const socialImage = new URL(SOCIAL_IMAGE_PATH, SITE_URL).toString();
  const alternateLocale = routing.locales
    .filter((supportedLocale) => supportedLocale !== locale)
    .map((supportedLocale) => SITE_METADATA[supportedLocale].openGraphLocale);

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Bababou",
    title: { absolute: metadata.title },
    description: metadata.description,
    keywords: ["Bababou", "family", "family messages", "family contact"],
    authors: [{ name: "Alban Andrieu", url: "https://albanandrieu.com" }],
    creator: "Alban Andrieu",
    publisher: "Alban Andrieu",
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      title: metadata.title,
      description: metadata.description,
      url: canonical,
      locale: metadata.openGraphLocale,
      alternateLocale,
      siteName: "Bababou",
      images: [
        {
          url: socialImage,
          secureUrl: socialImage,
          type: "image/png",
          alt: metadata.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      creator: TWITTER_CREATOR,
      images: [{ url: socialImage, alt: metadata.imageAlt }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const site = messages.site as {
    backHome: string;
    backToTop: string;
    backToTopAria: string;
    copyright: string;
    legalNotices: string;
    rssFeedAria: string;
  };
  const contactPage = messages.contactPage as {
    information: { title: string };
  };
  const copyright = site.copyright.replace(
    "{year}",
    String(new Date().getUTCFullYear()),
  );

  const configuredAnalyticsMode = process.env.NEXT_PUBLIC_ANALYTICS_MODE;
  const analyticsMode = ["full", "home", "showcase", "vercel"].includes(
    configuredAnalyticsMode ?? "",
  )
    ? configuredAnalyticsMode
    : "vercel";

  return (
    <html lang={locale} data-nabla-app="next-intl" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link rel="stylesheet" href="/landing-sections.css" />
        <link rel="stylesheet" href="/wireframe.css" />
        <link rel="stylesheet" href="/theme.css" />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/print.css" />
        <link rel="stylesheet" href="/site-content-page.css" />
        <link rel="stylesheet" href="/page-layouts.css" />
        <link rel="stylesheet" href="/assets/fontawesome/css/fontawesome.css" />
        <link rel="stylesheet" href="/assets/fontawesome/css/brands.css" />
        <link rel="stylesheet" href="/assets/fontawesome/css/solid.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.1/css/bootstrap.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={{ site }}>
          <RouteHeader />
          {children}
          <Footer
            backHome={site.backHome}
            backToTop={site.backToTop}
            backToTopAria={site.backToTopAria}
            contactLabel={contactPage.information.title}
            copyright={copyright}
            legalNotices={site.legalNotices}
            locale={locale}
            rssFeedAria={site.rssFeedAria}
          />
        </NextIntlClientProvider>
        <Script
          src="/site-analytics.js"
          data-analytics-mode={analyticsMode}
          data-ahrefs-key={process.env.AHREFS_ANALYTICS_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
