import styles from "./LegacyTranslatorHelpSection.module.css";

/**
 * Already-public calls for volunteer translators, without the historical
 * third-party allegations or personal identifiers in the surrounding gallery.
 * Contact is handled by the existing approved homepage contact section.
 */
const requests = [
  { language: "Norwegian or Swedish", title: "Looking for Norwegian Translator" },
  { language: "German", title: "Looking for German Translator" },
] as const;

export default function LegacyTranslatorHelpSection() {
  return (
    <section
      id="preview-translators"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-translators-heading"
    >
      <h2 id="preview-translators-heading">Help translate</h2>
      <p>Language support can help make public information easier to understand.</p>
      <ul className={styles.requests}>
        {requests.map(({ language, title }) => (
          <li key={language}>
            <h3>{title}</h3>
            <p>Do you speak {language}?</p>
            <a href="#preview-contact">Get in touch</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
