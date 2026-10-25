import Image from "next/image";

import styles from "./LegacyStoryGallerySection.module.css";

/**
 * Replaces the ten-card Bootstrap gallery on the legacy homepage.
 * Existing historical illustrations are reused where they do not show
 * identity documents or pinpoint a child's location.
 *
 * Cards with sensitive allegations/identifiers are intentionally rewritten:
 * the shape and navigation are preserved, not those claims.
 */
const cards = [
  {
    title: "A message for my daughter",
    description: "A place for a personal message, written with love and hope.",
    image: "/assets/alone-1.jpg",
    href: "#preview-opening",
    link: "Read the message",
  },
  {
    title: "How to get in touch",
    description: "A direct way to contact me, without a third-party service.",
    image: null,
    href: "#preview-contact",
    link: "Contact me",
  },
  {
    title: "Family and belonging",
    description: "The ties to family in France remain important to me.",
    image: "/assets/miss-and-love-you-quote.jpeg",
    href: "#preview-letter",
    link: "Read my letter",
  },
  {
    title: "A long search",
    description: "The search for family contact has continued over many years.",
    image: "/assets/hide-and-sick-quote.jpg",
    href: "#preview-journey",
    link: "See the journey",
  },
  {
    title: "Documents and context",
    description: "Find the public explanations and the document processing notice.",
    image: null,
    href: "#preview-document-disclosure",
    link: "Read the notice",
  },
  {
    title: "Looking for Norwegian Translator",
    description: "Norwegian or Swedish language support would be welcome.",
    image: "/assets/flag-french-norway-simple.svg",
    href: "#preview-contact",
    link: "Get in touch",
  },
  {
    title: "Patience and hope",
    description: "A message of continued care and encouragement.",
    image: "/assets/patience-vertue-quote.jpg",
    href: "#preview-found-website",
    link: "Read the message",
  },
  {
    title: "Looking for German Translator",
    description: "German language support would be welcome.",
    image: "/assets/flag-french-germany.svg",
    href: "#preview-contact",
    link: "Get in touch",
  },
  {
    title: "People and institutions contacted",
    description: "Explore the public resource page about this process.",
    image: null,
    href: "#preview-people",
    link: "See the resources",
  },
  {
    title: "Always here",
    description: "A personal message that remains available to read.",
    image: null,
    href: "#preview-found-website",
    link: "Read the note",
  },
] as const;

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
        {cards.map((card) => (
          <li key={card.title} className={styles.card}>
            <div className={styles.media}>
              {card.image ? (
                <Image
                  src={card.image}
                  alt=""
                  width={800}
                  height={460}
                  sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 33vw"
                  className={styles.image}
                />
              ) : (
                <span className={styles.fallback} aria-hidden="true">♥</span>
              )}
            </div>
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
