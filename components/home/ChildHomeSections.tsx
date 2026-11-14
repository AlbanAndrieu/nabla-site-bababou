import type { AppLocale } from "@/i18n/routing";
import { homeAudienceCards, homeAudienceCopy, fathersAudiencePath } from "@/lib/homeAudienceCopy.mjs";
import GalleryCardMedia from "./GalleryCardMedia";
import styles from "./LegacyStoryGallerySection.module.css";
import sectionStyles from "./LegacyOpeningSection.module.css";
import messageStyles from "./LegacyMessageSection.module.css";
import homeStyles from "./ChildHomeSections.module.css";

/**
 * Personal messages for Éléonore. Safe for a public review: no minor's ID,
 * identity documents or precise locations. The original legacy page stays
 * unchanged until the user approves a manual publication cutover.
 */
export default function ChildHomeSections({ locale }: { locale: AppLocale }) {
  const c = homeAudienceCopy(locale).child;
  const cards = homeAudienceCards(locale, "child");
  return (
    <>
      <section className={`${sectionStyles.section} ${homeStyles.opening}`} id="preview-opening" aria-labelledby="preview-opening-heading">
        <h2 id="preview-opening-heading">{c.openingTitle}</h2>
        <h3>{c.greeting}</h3>
        <p>{c.opening}</p>
        <p>{c.openingSecond}</p>
      </section>
      <section className={messageStyles.section} id="preview-letter" aria-labelledby="preview-letter-heading">
        <h2 id="preview-letter-heading">{c.letterTitle}</h2>
        <blockquote className={messageStyles.quote}>
          {c.letter.map((paragraph: string) => <p key={paragraph}>{paragraph}</p>)}
        </blockquote>
      </section>
      <section className={sectionStyles.section} id="preview-hope" aria-labelledby="preview-hope-heading">
        <h2 id="preview-hope-heading">{c.hopeTitle}</h2>
        <p>{c.hopeText}</p>
      </section>
      <section className={sectionStyles.section} id="preview-journey" aria-labelledby="preview-journey-heading">
        <h2 id="preview-journey-heading">{c.journeyTitle}</h2>
        <p>{c.journeyText}</p>
      </section>
      <section className={sectionStyles.section} id="preview-identity" aria-labelledby="preview-identity-heading">
        <h2 id="preview-identity-heading">{c.identityTitle}</h2>
        <p>{c.identityText}</p>
      </section>
      <section className={sectionStyles.section} id="preview-contact" aria-labelledby="preview-contact-heading">
        <h2 id="preview-contact-heading">{c.contactTitle}</h2>
        <p>{c.contactText}</p>
        <p><a href="mailto:aa@bababou.com">aa@bababou.com</a></p>
        <p><a href={fathersAudiencePath(locale)}>{c.fathersLink}</a></p>
      </section>
      <section className={styles.section} id="preview-story-gallery" aria-labelledby="preview-story-gallery-heading">
        <div className={styles.heading}><h2 id="preview-story-gallery-heading">{c.letterTitle}</h2></div>
        <ul className={styles.grid}>
          {cards.map((card: {image: string;href: string;title: string;description: string;link: string}) => (
            <li key={card.href} className={styles.card}>
              <GalleryCardMedia image={card.image} />
              <div className={styles.body}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <a href={card.href}>{card.link}</a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
