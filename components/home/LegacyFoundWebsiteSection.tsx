import styles from "./LegacyFoundWebsiteSection.module.css";

/**
 * Approved published text from public/index.html.
 * This is a static message. Do not add a live alert: it would interrupt
 * screen readers without any live change.
 * Retain lang="en" until translations have been reviewed.
 */
export default function LegacyFoundWebsiteSection() {
  return (
    <section
      id="preview-found-website"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-found-website-heading"
    >
      <h2 id="preview-found-website-heading">
        If you are Éléonore (Bababou) and you found this website:
      </h2>
      <p>
        Please know that contacting me is YOUR RIGHT. No one can stop you from
        knowing your father. I am here waiting for you with open arms. 💙
      </p>
      <p className={styles.tagline}>
        This website was created by your father to help you find him. He has
        been searching for you since 2015.
      </p>
    </section>
  );
}
