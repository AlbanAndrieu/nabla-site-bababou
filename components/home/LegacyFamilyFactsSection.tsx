import styles from "./LegacyFamilyFactsSection.module.css";

/**
 * Public-facing summary of the approved first-screen message.
 * Intentionally excludes identity-document numbers, precise locations and
 * claims about third parties present in the original HTML.
 */
const points = [
  "Your family in France loves you and misses you.",
  "Your Papa has been looking for you since 2015.",
  "I am here if you want to contact me.",
  "You can read more about the resources and people contacted below.",
] as const;

export default function LegacyFamilyFactsSection() {
  return (
    <section
      id="preview-important-information"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-important-information-heading"
    >
      <h2 id="preview-important-information-heading">
        Important Information You Should Know
      </h2>
      <ul className={styles.list}>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className={styles.contact}>
        <a href="#preview-contact">How to contact me</a>
      </p>
    </section>
  );
}
