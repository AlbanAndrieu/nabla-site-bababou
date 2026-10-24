import styles from "./LegacyOpeningSection.module.css";

/**
 * Published introduction from public/index.html.
 * In the migration preview, the localized hero already owns the sole h1.
 * Preserve the English text and use h2/h3 for a valid heading order.
 */
export default function LegacyOpeningSection() {
  return (
    <section
      id="preview-opening"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-opening-heading"
    >
      <h2 id="preview-opening-heading">
        Éléonore (Bababou) — If you are reading this, your Papa is looking for you
      </h2>
      <h3>My Dear Daughter,</h3>
      <p>
        <strong>I am your father, Alban Andrieu.</strong> Every single day since
        June 6, 2015, I have been searching for you. I have never stopped
        thinking about you, and I will never stop looking for you.
      </p>
      <p>
        <strong>YOU ARE NOT ALONE.</strong> I am here. I am waiting. I am your Papa
        and I love you more than anything in this world.
      </p>
    </section>
  );
}
