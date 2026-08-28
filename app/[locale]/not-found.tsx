import { hasLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

import styles from "./NotFound.module.css";

export default async function NotFound() {
  const requestedLocale = await getLocale();
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "site.notFound" });

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={styles.shell}>
        <section className={styles.panel} aria-labelledby="not-found-title">
          <p className={styles.code} aria-hidden="true">
            404
          </p>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1 id="not-found-title" className={styles.title}>
            {t("title")}
          </h1>
          <p className={styles.description}>{t("description")}</p>
          <div className={styles.actions}>
            <ActionLink href={canonicalPagePath("index", locale)}>
              <i className="fas fa-home" aria-hidden="true" />
              <span>{t("backHome")}</span>
            </ActionLink>
          </div>
        </section>
      </main>
    </>
  );
}
