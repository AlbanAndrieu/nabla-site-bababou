import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import {
  getPolicyPage,
  isPolicyPageSlug,
  POLICY_PAGE_SLUGS,
} from "@/lib/policyPages";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    POLICY_PAGE_SLUGS.map((policy) => ({ locale, policy })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/policy/[policy]">): Promise<Metadata> {
  const { locale, policy } = await params;
  if (!hasLocale(routing.locales, locale) || !isPolicyPageSlug(policy)) {
    return {};
  }

  const page = getPolicyPage(policy);
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: page.canonicalPath,
    },
    openGraph: {
      type: "website",
      url: page.canonicalPath,
      title: page.title,
      description: page.socialDescription,
      siteName: page.siteName,
    },
    twitter: {
      card: "summary",
      title: page.title,
      description: page.socialDescription,
    },
  };
}

export default async function PolicyPage({
  params,
}: PageProps<"/[locale]/policy/[policy]">) {
  const { locale, policy } = await params;
  if (!hasLocale(routing.locales, locale) || !isPolicyPageSlug(policy)) {
    notFound();
  }

  setRequestLocale(locale);
  const page = getPolicyPage(policy);

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main
        id="main-content"
        className="site-content-page policy-legal container py-4"
        lang={page.contentLanguage}
      >
        <PublicHtmlFragment
          file={page.sourceFile}
          mode="main"
          locale={locale}
        />
      </main>
    </>
  );
}
