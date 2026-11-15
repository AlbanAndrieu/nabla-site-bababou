import "../design-tokens.css";
import "../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Footer from "@/app/components/Footer";
import RouteHeader from "@/components/RouteHeader";
import ThemeBootstrap from "@/components/ThemeBootstrap";
import { routing } from "@/i18n/routing";
import { localizedSiteMetadata } from "@/lib/siteSocialMetadata";

// Every supported language is known at build time. Unknown locales must
// fail closed rather than generating new SSR work for crawlers and probes.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  return localizedSiteMetadata(locale);
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
    footerNavigationAria: string;
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
        <ThemeBootstrap />
        <meta name="color-scheme" content="light dark" />
        <meta name="text-scale" content="scale" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Bababou — RSS"
          href="/feed.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Bababou — dedicated contact RSS"
          href="/eleonore-feed.xml"
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
            navigationAriaLabel={site.footerNavigationAria}
            copyright={copyright}
            legalNotices={site.legalNotices}
            locale={locale}
          />
        </NextIntlClientProvider>
        <Script
          src="/document-access-links.mjs"
          type="module"
          strategy="afterInteractive"
          data-bababou-document-access=""
        />
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
