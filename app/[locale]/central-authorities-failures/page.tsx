import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import { routing } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import {
  ArticleHero,
  CountryFailures,
  FailureSummary,
  FailureTimeline,
  ReadMore,
  type CentralAuthoritiesFailuresCopy,
} from "./sections";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/central-authorities-failures">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({
    locale,
    namespace: "centralAuthoritiesFailuresPage",
  });

  return localizedPageMetadata(
    "central-authorities-failures",
    locale,
    t("meta.title"),
    t("meta.description"),
  );
}

export default async function CentralAuthoritiesFailuresPage({
  params,
}: PageProps<"/[locale]/central-authorities-failures">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const copy =
    messages.centralAuthoritiesFailuresPage as unknown as CentralAuthoritiesFailuresCopy;

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={styles.page}>
        <Container>
          <ArticleHero copy={copy} />
          <FailureSummary copy={copy} />
          <CountryFailures copy={copy} />
          <FailureTimeline copy={copy} />
          <ReadMore copy={copy} />
        </Container>
      </main>
    </>
  );
}
