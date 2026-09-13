import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import { type AppLocale, routing } from "@/i18n/routing";
import { loadNreLegacyRows } from "@/lib/nreLegacyData";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import {
  NreExceptions,
  NreHero,
  NreLocation,
  NreNote,
  NreReference,
  NreStats,
  NreTable,
  NreTimeline,
  type NrePageCopy,
} from "./sections";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/nre">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "nrePage" });
  return localizedPageMetadata("nre", locale, t("meta.title"), t("meta.description"));
}

export default async function NrePage({ params }: PageProps<"/[locale]/nre">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const [messages, rows] = await Promise.all([
    getMessages({ locale }),
    loadNreLegacyRows(locale as AppLocale),
  ]);
  const copy = messages.nrePage as unknown as NrePageCopy;

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={styles.page}>
        <Container>
          <NreHero copy={copy} />
          <NreStats copy={copy} rows={rows} />
          <NreReference copy={copy} />
          <NreNote copy={copy} />
          <NreTimeline copy={copy} rows={rows} locale={locale as AppLocale} />
          <NreLocation copy={copy} />
          <NreTable copy={copy} rows={rows} locale={locale as AppLocale} />
          <NreExceptions copy={copy} rows={rows} locale={locale as AppLocale} />
        </Container>
      </main>
    </>
  );
}
