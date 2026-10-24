import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import LegacyContactSection from "@/components/home/LegacyContactSection";
import LegacyOpeningSection from "@/components/home/LegacyOpeningSection";
import LegacyMessageSection from "@/components/home/LegacyMessageSection";
import LegacyFoundWebsiteSection from "@/components/home/LegacyFoundWebsiteSection";
import SkipToMainContent from "@/components/SkipToMainContent";
import { routing } from "@/i18n/routing";
import styles from "./page.module.css";

/**
 * Migration workspace, not a public homepage.
 *
 * Keep public/index.html as the approved source until all legacy sections,
 * interactive widgets, accessibility checks and SEO contracts have parity.
 * This server-only flag is intentionally disabled by default.
 */
function previewEnabled() {
  return process.env.HOMEPAGE_PREVIEW_ENABLED === "true";
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/home-preview">): Promise<Metadata> {
  const { locale } = await params;
  if (!previewEnabled() || !hasLocale(routing.locales, locale)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({ locale, namespace: "homepagePreview" });
  return {
    title: t("title"),
    description: t("intro"),
    robots: { index: false, follow: false },
    // Do not promote or index these incomplete localized homepages.
    alternates: { canonical: "/" },
  };
}

export default async function HomePreview({
  params,
}: PageProps<"/[locale]/home-preview">) {
  if (!previewEnabled()) notFound();

  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("homepagePreview");

  return (
    <>
      <SkipToMainContent />
      <main id="main-content" className={styles.main}>
        <section className={styles.hero} aria-labelledby="preview-title">
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1 id="preview-title">{t("heading")}</h1>
          <p className={styles.intro}>{t("intro")}</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#preview-contact">
              {t("contact")}
            </a>
            <a className={styles.secondary} href="/">
              {t("legacy")}
            </a>
          </div>
        </section>
        <LegacyOpeningSection />
        <LegacyContactSection />
        <LegacyMessageSection />
        <LegacyFoundWebsiteSection />
        <section className={styles.resources} aria-labelledby="preview-resources">
          <h2 id="preview-resources">{t("linksTitle")}</h2>
          <ul>
            <li><a href="/people-contacted.html">{t("history")}</a></li>
            <li><a href="/for-fathers.html">{t("fathers")}</a></li>
            <li><a href="/feed.xml">{t("rss")}</a></li>
          </ul>
          <p className={styles.note}>{t("note")}</p>
        </section>
      </main>
    </>
  );
}
