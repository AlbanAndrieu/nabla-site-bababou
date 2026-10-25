import styles from "./LegacyJourneySection.module.css";

/**
 * The original homepage contains a country-level journey illustration.
 * This React version preserves its layout and historical country context
 * without giving a child's location, legal allegations or speculative stops.
 */
const countries = [
  { flag: "🇫🇷", name: "France" },
  { flag: "🇳🇴", name: "Norway" },
  { flag: "🇩🇪", name: "Germany" },
] as const;

export default function LegacyJourneySection() {
  return (
    <section
      id="preview-journey"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-journey-heading"
    >
      <p className={styles.eyebrow}>A story across borders</p>
      <h2 id="preview-journey-heading">France, Norway and Germany</h2>
      <p>
        My search for contact with my daughter has involved different countries
        and legal systems. This is a historical overview, not a statement of
        anyone&apos;s current location.
      </p>
      <ol className={styles.journey} aria-label="Countries mentioned in this story">
        {countries.map(({ flag, name }) => (
          <li key={name} className={styles.step}>
            <span className={styles.flag} aria-hidden="true">{flag}</span>
            <span className={styles.name}>{name}</span>
          </li>
        ))}
      </ol>
      <p>
        <a href="/for-fathers.html">
          Read more about the international legal framework and resources
        </a>
      </p>
    </section>
  );
}
