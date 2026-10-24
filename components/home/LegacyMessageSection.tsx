import styles from "./LegacyMessageSection.module.css";

/**
 * Preserve the published English message from public/index.html.
 * Do not invent localized wording or change the approved text.
 */
export default function LegacyMessageSection() {
  return (
    <section
      id="preview-letter"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-letter-heading"
    >
      <h2 id="preview-letter-heading">A Message from Your Papa:</h2>
      <blockquote className={styles.quote}>
        <p>
          &quot;Éléonore (Bababou), wherever you are, whatever you have been told,
          please know this:{" "}
          <strong>
            I have never stopped loving you. I have never stopped fighting for
            you. I will always be here for you.
          </strong>
        </p>
        <p>
          You might have questions, you might be confused, you might not
          remember me well. That&apos;s okay. I understand. Just know that your
          Papa loves you unconditionally and will be there to support you
          whenever you&apos;re ready.
        </p>
        <p>
          <strong>
            I love you more than yesterday and less than tomorrow. Forever.
          </strong>
        </p>
      </blockquote>
    </section>
  );
}
