import styles from "./LegacyContactSection.module.css";

/**
 * First owner-approved section migrated from public/index.html.
 *
 * Keep the original English text unchanged. On localized previews, lang=en
 * tells assistive technology the actual language of this approved excerpt.
 * Add approved translations only after review, never by silent paraphrase.
 */
export default function LegacyContactSection() {
  return (
    <section
      id="preview-contact"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-contact-heading"
    >
      <h2 id="preview-contact-heading">How to contact me</h2>
      <p>
        Email me at:{" "}
        <a href="mailto:aa@bababou.com">aa@bababou.com</a>
      </p>
      <p>
        You can contact me anytime, day or night. I promise I will respond
        immediately. You are safe to reach out to me.
      </p>
    </section>
  );
}
