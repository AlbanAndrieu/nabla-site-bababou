import styles from "./LegacyDisclosureSection.module.css";

/** Preserve the published disclosure text and native details/summary behavior. */
export default function LegacyDisclosureSection() {
  return (
    <section
      id="preview-document-disclosure"
      className={styles.section}
      lang="en"
      aria-label="Documents on this website"
    >
      <details className={styles.details}>
        <summary className={styles.summary}>
          Documents on this website — processing notice
        </summary>
        <div className={styles.content}>
          <p>
            Documents provided on this website have been processed as follows:
            spelling and grammar fixes, anonymization (to protect the child),
            and translation when required. Otherwise they remain as close as
            possible to the original.
          </p>
          <p>
            Some documents are missing because they require validation before
            being published.
          </p>
        </div>
      </details>
    </section>
  );
}
