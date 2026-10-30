import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ChildHomeSections from "@/components/home/ChildHomeSections";
import LegacyFooterSection from "@/components/home/LegacyFooterSection";
import { routing } from "@/i18n/routing";
import { homeAudienceCopy, fathersAudiencePath } from "@/lib/homeAudienceCopy.mjs";
import { isHomeCutoverEnabled } from "@/lib/homeCutoverPolicy.mjs";
import { localizedSiteMetadata } from "@/lib/siteSocialMetadata";
import styles from "./home-preview/page.module.css";

/** Public replacement dormant until release approvals and deployed SHA agree. */
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isHomeCutoverEnabled()) {
    return { robots: { index: false, follow: false } };
  }
  const meta = localizedSiteMetadata(locale);
  const c = homeAudienceCopy(locale).child;
  return { ...meta, title: c.title, description: c.intro };
}

export default async function PublicHomepage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isHomeCutoverEnabled()) redirect("/");
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("homepagePreview");
  const c = homeAudienceCopy(locale).child;
  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <section className={styles.hero} aria-labelledby="preview-title">
        <p className={styles.eyebrow}>{c.eyebrow}</p>
        <h1 id="preview-title">{c.title}</h1>
        <p className={styles.intro}>{c.intro}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#preview-contact">{c.contactTitle}</a>
          <a className={styles.secondary} href={fathersAudiencePath(locale)}>{c.fathersLink}</a>
        </div>
      </section>
      <nav className={styles.sectionNav} data-home-section-nav aria-label={t("sectionNavigation")}>
        <a href="#preview-opening">{c.letterTitle}</a>
        <a href="#preview-hope">{c.hopeTitle}</a>
        <a href="#preview-journey">{c.journeyTitle}</a>
        <a href="#preview-people">{c.peopleTitle}</a>
        <a href="#preview-contact">{c.contactTitle}</a>
      </nav>
      <ChildHomeSections locale={locale} />
      <section className={styles.resources} aria-labelledby="preview-resources">
        <h2 id="preview-resources">{c.rssTitle}</h2>
        <ul>
          <li><a href="/feed.xml">{t("rss")}</a></li>
          <li><a href="/eleonore-feed.xml">{t("rss")} — Éléonore</a></li>
        </ul>
      </section>
      <LegacyFooterSection locale={locale} />
    </main>
  );
}
