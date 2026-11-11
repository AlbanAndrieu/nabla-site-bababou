import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ChildHomeSections from "@/components/home/ChildHomeSections";
import { routing } from "@/i18n/routing";
import { homeAudienceCopy, fathersAudiencePath } from "@/lib/homeAudienceCopy.mjs";
import styles from "./page.module.css";

/** Review-only homepage for Éléonore; never index until separately approved. */
// Public, review-only content is generated at build time, never per request.
export const dynamic = "force-static";
export async function generateMetadata({ params }: PageProps<"/[locale]/home-preview">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return { robots: { index: false, follow: false } };
  const c = homeAudienceCopy(locale).child;
  return {
    title: c.title,
    description: c.intro,
    robots: { index: false, follow: false },
    alternates: { canonical: "/" },
  };
}

export default async function HomePreview({ params }: PageProps<"/[locale]/home-preview">) {
  const { locale } = await params;
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
          <a className={styles.secondary} href="/">{c.legacyLink}</a>
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

    </main>
  );
}
