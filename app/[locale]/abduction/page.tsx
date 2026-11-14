import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import AbductionResources from "@/components/home/AbductionResources";
import LegacyFooterSection from "@/components/home/LegacyFooterSection";
import { routing } from "@/i18n/routing";
import { homeAudienceCopy, childAudiencePath } from "@/lib/homeAudienceCopy.mjs";
import { isHomeCutoverEnabled } from "@/lib/homeCutoverPolicy.mjs";
import styles from "../home-preview/page.module.css";

/** A safe, public review surface for parents and volunteer translators. */
export async function generateMetadata({ params }: PageProps<"/[locale]/abduction">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { robots: { index: false, follow: false } };
  const c = homeAudienceCopy(locale).fathers;
  return {
    title: c.title,
    description: c.intro,
    robots: { index: false, follow: false },
    // This separate page is in editorial review, not yet an indexable release.
  };
}

export default async function AbductionPage({ params }: PageProps<"/[locale]/abduction">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const c = homeAudienceCopy(locale).fathers;
  const catalog = (await getMessages({ locale })).legacyArticlesPage as {
    reviewNavigation: string;
    fathers: { title: string };
    norway: { title: string };
    germany: { title: string };
  };
  const prefix = locale === "fr" ? "" : "/" + locale;
  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <section className={styles.hero} aria-labelledby="abduction-title">
        <p className={styles.eyebrow}>{c.eyebrow}</p>
        <h1 id="abduction-title">{c.title}</h1>
        <p className={styles.intro}>{c.intro}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#parent-contact">{c.contactLink}</a>
          <a className={styles.secondary} href={childAudiencePath(locale, !isHomeCutoverEnabled())}>{c.homeLink}</a>
        </div>
      </section>
      <nav className={styles.sectionNav} aria-label={c.resourcesTitle}>
        <a href="#child-abduction">{c.navAbduction}</a>
        <a href="#translators">{c.navTranslators}</a>
        <a href="#preview-associations">{c.navAssociations}</a>
        <a href="#documents-notice">{c.navDocuments}</a>
      </nav>
      <nav className={styles.sectionNav} aria-label={catalog.reviewNavigation}>
        <span>{catalog.reviewNavigation}</span>
        <Link href={prefix + "/for-fathers"}>{catalog.fathers.title}</Link>
        <Link href={prefix + "/abduction-norway"}>{catalog.norway.title}</Link>
        <Link href={prefix + "/abduction-germany"}>{catalog.germany.title}</Link>
      </nav>
      <AbductionResources locale={locale} />
      <LegacyFooterSection locale={locale} />
    </main>
  );
}
