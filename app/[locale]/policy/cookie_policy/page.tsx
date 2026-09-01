import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";

const TITLE = "Cookie Policy | Bababou";
const DESCRIPTION =
  "Cookie policy for bababou.com. How we use cookies and similar technologies and how you can manage your preferences.";
const SOCIAL_DESCRIPTION =
  "Cookie policy for bababou.com. How we use cookies and how you can manage your preferences.";
const CANONICAL_PATH = "/policy/cookie_policy";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/policy/cookie_policy">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: CANONICAL_PATH,
    },
    openGraph: {
      type: "website",
      url: CANONICAL_PATH,
      title: TITLE,
      description: SOCIAL_DESCRIPTION,
      siteName: "Bababou",
    },
    twitter: {
      card: "summary",
      title: TITLE,
      description: SOCIAL_DESCRIPTION,
    },
  };
}

export default async function CookiePolicyPage({
  params,
}: PageProps<"/[locale]/policy/cookie_policy">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main
        id="main-content"
        className="site-content-page policy-legal container py-4"
        lang="en"
      >
        <PublicHtmlFragment
          file="policy/cookie_policy.html"
          mode="main"
          locale={locale}
        />
      </main>
    </>
  );
}
