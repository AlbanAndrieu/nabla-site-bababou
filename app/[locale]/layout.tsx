import "../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Footer from "@/app/components/Footer";
import type { LayoutProps } from "@/app/types";
import RouteHeader from "@/components/RouteHeader";
import { routing } from "@/i18n/routing";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

type LocaleMetadataProps = {
  params: Promise<{ locale: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bababou.com";
const SITE_METADATA = {
  fr: {
    title: "Bababou — Site familial",
    description:
      "Un espace familial dédié à Bababou pour préserver des souvenirs, partager des messages et faciliter la reprise de contact.",
  },
  en: {
    title: "Bababou — Family site",
    description:
      "A family space dedicated to Bababou, preserving memories, sharing messages and making it easier to reconnect.",
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
}: LocaleMetadataProps): Promise<Metadata> {
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

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: metadata.title },
    description: metadata.description,
    keywords: ["Bababou", "family", "family memories"],
    authors: [{ name: "Alban Andrieu" }],
    creator: "Alban Andrieu",
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
      locale: locale === "fr" ? "fr_FR" : "en_US",
      siteName: "Bababou",
      images: [
        {
          url: "/assets/miss-and-love-you-quote.png",
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: ["/assets/miss-and-love-you-quote.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const site = messages.site as {
    backHome: string;
    backToTop: string;
    backToTopAria: string;
    legalNotices: string;
    rssFeedAria: string;
  };

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
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RouteHeader />
          {children}
          <Footer
            backHome={site.backHome}
            backToTop={site.backToTop}
            backToTopAria={site.backToTopAria}
            legalNotices={site.legalNotices}
            locale={locale}
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
