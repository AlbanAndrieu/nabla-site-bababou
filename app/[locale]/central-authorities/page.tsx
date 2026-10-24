import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import { routing } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import {
  AuthoritiesContacts,
  AuthoritiesDocuments,
  AuthoritiesHero,
  AuthoritiesSummary,
  AuthoritiesTimeline,
  LegalGrounds,
  type CentralAuthoritiesCopy,
} from "./sections";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/central-authorities">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "centralAuthoritiesPage" });
  return localizedPageMetadata(
    "central-authorities",
    locale,
    t("meta.title"),
    t("meta.description"),
  );
}

export default async function CentralAuthoritiesPage({
  params,
}: PageProps<"/[locale]/central-authorities">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const copy = messages.centralAuthoritiesPage as unknown as CentralAuthoritiesCopy;

  return (
    <>
      <TopAnchor />
      <main id="main-content" className={styles.page}>
        <Container>
          <AuthoritiesHero copy={copy} />
          <AuthoritiesSummary copy={copy} />
          <AuthoritiesTimeline copy={copy} />
          <LegalGrounds copy={copy} />
          <AuthoritiesDocuments copy={copy} />
          <AuthoritiesContacts copy={copy} />
        </Container>
      </main>
    </>
  );
}
