import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";

const TITLE = "Accessibility Statement | Bababou";
const DESCRIPTION =
  "Accessibility statement for bababou.com. Our commitment to digital accessibility and WCAG compliance.";
const SOCIAL_DESCRIPTION =
  "Accessibility statement for bababou.com. Our commitment to digital accessibility.";
const CANONICAL_PATH = "/policy/accessibility_statement";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/policy/accessibility_statement">): Promise<Metadata> {
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

export default async function AccessibilityStatementPage({
  params,
}: PageProps<"/[locale]/policy/accessibility_statement">) {
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
          file="policy/accessibility_statement.html"
          mode="main"
          locale={locale}
        />
      </main>
    </>
  );
}
