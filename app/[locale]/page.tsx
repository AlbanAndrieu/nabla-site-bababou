import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isHomeCutoverEnabled } from "@/lib/homeCutoverPolicy.mjs";
import { localizedSiteMetadata } from "@/lib/siteSocialMetadata";

import LegacyContactSection from "@/components/home/LegacyContactSection";
import LegacyOpeningSection from "@/components/home/LegacyOpeningSection";
import LegacyMessageSection from "@/components/home/LegacyMessageSection";
import LegacyFoundWebsiteSection from "@/components/home/LegacyFoundWebsiteSection";
import LegacyLegalResourcesSection from "@/components/home/LegacyLegalResourcesSection";
import LegacyFamilyFactsSection from "@/components/home/LegacyFamilyFactsSection";
import LegacySiteAboutSection from "@/components/home/LegacySiteAboutSection";
import LegacyJourneySection from "@/components/home/LegacyJourneySection";
import LegacyStoryGallerySection from "@/components/home/LegacyStoryGallerySection";
import LegacyPeopleSection from "@/components/home/LegacyPeopleSection";
import LegacyAssociationsSection from "@/components/home/LegacyAssociationsSection";
import LegacyDisclosureSection from "@/components/home/LegacyDisclosureSection";
import LegacyFooterSection from "@/components/home/LegacyFooterSection";
import FrenchHomeSections from "@/components/home/FrenchHomeSections";
import { routing } from "@/i18n/routing";
import styles from "./home-preview/page.module.css";

/**
 * This public homepage is intentionally dormant. It cannot be published by
 * a query, cookie, browser signal or an unapproved deployment SHA.
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return { robots: { index: false, follow: false } };
  }
  if (!isHomeCutoverEnabled()) {
    return { robots: { index: false, follow: false } };
  }
  return localizedSiteMetadata(locale);
}

export default async function PublicHomepage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isHomeCutoverEnabled()) redirect("/");
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("homepagePreview");

  return (
    <>
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.hero} aria-labelledby="preview-title">
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1 id="preview-title">{t("heading")}</h1>
          <p className={styles.intro}>{t("publicIntro")}</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#preview-contact">
              {t("contact")}
            </a>
          </div>
        </section>
        <nav className={styles.sectionNav} data-home-section-nav aria-label={t("sectionNavigation")}>
          <a href="#preview-opening">{t("navStory")}</a>
          <a href="#preview-journey">{t("navJourney")}</a>
          <a href="#preview-story-gallery">{t("navGallery")}</a>
          <a href="#preview-contact">{t("navContact")}</a>
          <a href="#preview-document-disclosure">{t("navDocuments")}</a>
        </nav>
        {locale === "fr" ? (
          <FrenchHomeSections />
        ) : (
          <>
            <LegacyOpeningSection />
            <LegacyFamilyFactsSection />
            <LegacyContactSection />
            <LegacyMessageSection />
            <LegacyFoundWebsiteSection />
            <LegacySiteAboutSection />
            <LegacyJourneySection />
            <LegacyLegalResourcesSection locale={locale} />
            <LegacyStoryGallerySection />
            <LegacyPeopleSection />
            <LegacyAssociationsSection />
            <LegacyDisclosureSection />
          </>
        )}
        <section className={styles.resources} aria-labelledby="preview-resources">
          <h2 id="preview-resources">{t("linksTitle")}</h2>
          <ul>
            <li><a href="/feed.xml">{t("rss")}</a></li>
            <li><a href="/eleonore-feed.xml">{t("rss")} — Éléonore</a></li>
          </ul>
        </section>
        <LegacyFooterSection locale={locale} />
      </main>
    </>
  );
}
