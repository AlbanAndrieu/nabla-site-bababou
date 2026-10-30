import type { AppLocale } from "@/i18n/routing";
import { homeAudienceCards, homeAudienceCopy, childAudiencePath } from "@/lib/homeAudienceCopy.mjs";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import GalleryCardMedia from "./GalleryCardMedia";
import LegacyAssociationsSection from "./LegacyAssociationsSection";
import galleryStyles from "./LegacyStoryGallerySection.module.css";
import sectionStyles from "./LegacyOpeningSection.module.css";
import legalStyles from "./LegacyLegalResourcesSection.module.css";
import disclosureStyles from "./LegacyDisclosureSection.module.css";

/** Resources and volunteer translation requests, separated from child-facing copy. */
export default function AbductionResources({ locale }: { locale: AppLocale }) {
  const c = homeAudienceCopy(locale).fathers;
  const cards = homeAudienceCards(locale, "fathers");
  return (
    <>
      <section className={sectionStyles.section} id="abduction-intro" aria-labelledby="abduction-intro-heading">
        <h2 id="abduction-intro-heading">{c.fathersTitle}</h2>
        <p>{c.fathersText}</p>
        <p><a href="/for-fathers.html">{c.fathersLink}</a></p>
      </section>
      <section className={sectionStyles.section} id="child-abduction" aria-labelledby="child-abduction-heading">
        <h2 id="child-abduction-heading">{c.abductionTitle}</h2>
        <p>{c.abductionText}</p>
        <p>
          <a href="https://en.wikipedia.org/wiki/Child_abduction" target="_blank" rel="noopener noreferrer">
            {c.abductionLink}
          </a>
        </p>
      </section>
      <section className={sectionStyles.section} id="parent-contact" aria-labelledby="parent-contact-heading">
        <h2 id="parent-contact-heading">{c.contactTitle}</h2>
        <p>{c.contactText}</p>
        <p><a href="mailto:aa@bababou.com">{c.contactLink} — aa@bababou.com</a></p>
      </section>
      <section className={sectionStyles.section} id="translators" aria-labelledby="translators-heading">
        <h2 id="translators-heading">{c.translatorsTitle}</h2>
        <p>{c.translatorsText}</p>
        <ul>
          <li><strong>{c.norwegianTitle}</strong> — {c.norwegianText}</li>
          <li><strong>{c.germanTitle}</strong> — {c.germanText}</li>
        </ul>
        <p><a href="mailto:aa@bababou.com">{c.contactLink}</a></p>
      </section>
      <section className={legalStyles.section} id="parent-resources" aria-labelledby="parent-resources-heading">
        <h2 id="parent-resources-heading">{c.resourcesTitle}</h2>
        <ul className={legalStyles.resources}>
          <li><a href={canonicalPagePath("nre", locale)}>{c.nreLink}</a></li>
          <li><a href={canonicalPagePath("central-authorities", locale)}>{c.authoritiesLink}</a></li>
          <li><a href="/for-fathers.html">{c.fathersLink}</a></li>
        </ul>
      </section>
      <LegacyAssociationsSection locale={locale} />
      <section className={disclosureStyles.section} id="documents-notice" aria-label={c.noticeTitle}>
        <details className={disclosureStyles.details}>
          <summary className={disclosureStyles.summary}>{c.noticeTitle}</summary>
          <div className={disclosureStyles.content}>
            <p>{c.noticeText}</p>
            <p>{c.noticeDisclaimer}</p>
          </div>
        </details>
      </section>
      <section className={galleryStyles.section} id="abduction-cards" aria-labelledby="abduction-cards-heading">
        <div className={galleryStyles.heading}><h2 id="abduction-cards-heading">{c.resourcesTitle}</h2></div>
        <ul className={galleryStyles.grid}>
          {cards.map((card: {image: string;href: string;title: string;description: string;link: string}) => (
            <li key={card.title} className={galleryStyles.card}>
              <GalleryCardMedia image={card.image} />
              <div className={galleryStyles.body}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <a href={card.href}>{card.link}</a>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className={sectionStyles.section}>
        <p><a href={childAudiencePath(locale)}>{c.homeLink}</a></p>
      </section>
    </>
  );
}
