import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import { routing } from "@/i18n/routing";
import { listCentralAuthorityDocuments } from "@/lib/centralAuthorityDocuments";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/central-authorities-documents">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({
    locale,
    namespace: "centralAuthorityDocumentsPage",
  });
  return localizedPageMetadata(
    "central-authorities-documents",
    locale,
    t("meta.title"),
    t("meta.description"),
  );
}

export default async function CentralAuthorityDocumentsPage({
  params,
}: PageProps<"/[locale]/central-authorities-documents">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: "centralAuthorityDocumentsPage",
  });
  const documents = await listCentralAuthorityDocuments();
  const groups = new Map<string, typeof documents>();

  for (const document of documents) {
    const group = groups.get(document.directory) ?? [];
    group.push(document);
    groups.set(document.directory, group);
  }

  const languageLabels = {
    fr: t("languages.fr"),
    en: t("languages.en"),
    de: t("languages.de"),
    no: t("languages.no"),
    unknown: t("languages.unknown"),
  } as const;

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={styles.page}>
        <Container>
          <header className={styles.hero}>
            <p className={styles.eyebrow}>{t("hero.eyebrow")}</p>
            <h1>{t("hero.title")}</h1>
            <p className={styles.lead}>{t("hero.lead")}</p>
            <div className={styles.actions}>
              <Link
                className={styles.primaryAction}
                href={canonicalPagePath("central-authorities", locale)}
              >
                {t("hero.backToOverview")}
              </Link>
            </div>
          </header>

          <section className={styles.notice} aria-labelledby="archive-notice-title">
            <h2 id="archive-notice-title">{t("notice.title")}</h2>
            <p>{t("notice.body")}</p>
          </section>

          <section aria-labelledby="documents-title" className={styles.archive}>
            <div className={styles.sectionHeading}>
              <h2 id="documents-title">{t("documents.title")}</h2>
              <p>{t("documents.count", { count: documents.length })}</p>
            </div>

            {[...groups.entries()].map(([directory, entries]) => (
              <section className={styles.group} key={directory || "root"}>
                <h3>{directory ? `ca/${directory}` : t("documents.rootGroup")}</h3>
                <ul className={styles.documentGrid}>
                  {entries.map((document) => (
                    <li className={styles.documentCard} key={document.relativePath}>
                      <a
                        data-document-entry
                        className={styles.documentLink}
                        href={document.href}
                        lang={document.sourceLocale ?? undefined}
                      >
                        {document.title}
                      </a>
                      <div className={styles.documentMeta}>
                        <span>
                          {languageLabels[document.sourceLocale ?? "unknown"]}
                        </span>
                        <code>{document.filename}</code>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        </Container>
      </main>
    </>
  );
}
