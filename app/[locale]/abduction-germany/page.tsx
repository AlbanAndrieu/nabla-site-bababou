import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LegacyArticleReview, { reviewArticleMetadata } from "@/components/legacy-articles/LegacyArticleReview";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/abduction-germany">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { robots: { index: false, follow: false } };
  return reviewArticleMetadata(locale, "germany");
}

export default async function ArticleReviewPage({
  params,
}: PageProps<"/[locale]/abduction-germany">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <LegacyArticleReview locale={locale} kind="germany" />;
}
