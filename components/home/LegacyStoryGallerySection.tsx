import { HOME_GALLERY_CARDS } from "@/lib/homeGalleryCatalog.mjs";

import GalleryCardMedia from "./GalleryCardMedia";
import styles from "./LegacyStoryGallerySection.module.css";

/**
 * Replaces the ten-card Bootstrap gallery on the legacy homepage.
 * Existing historical illustrations are reused where they do not show
 * identity documents or pinpoint a child's location.
 *
 * Cards with sensitive allegations/identifiers are intentionally rewritten:
 * the shape and navigation are preserved, not those claims.
 */
export default function LegacyStoryGallerySection() {
  return (
    <section
      id="preview-story-gallery"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-story-gallery-heading"
    >
      <div className={styles.heading}>
        <p className={styles.eyebrow}>From the original homepage</p>
        <h2 id="preview-story-gallery-heading">Messages and resources</h2>
        <p>
          A ten-card version of the original illustrated homepage layout.
          Sensitive documents and unverified statements are not reproduced.
        </p>
      </div>
      <ul className={styles.grid}>
        {HOME_GALLERY_CARDS.map((card) => (
          <li key={card.title} className={styles.card}>
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
  );
}
