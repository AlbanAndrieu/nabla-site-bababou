import styles from "./LegacySiteAboutSection.module.css";

/**
 * Preserve the legacy collapsed About and optional links without loading
 * calendaring, funding or third-party widget scripts on page load.
 */
export default function LegacySiteAboutSection() {
  return (
    <section id="preview-about" className={styles.section} lang="en">
      <details>
        <summary>About this site</summary>
        <div className={styles.content}>
          <p>Bababou — public messages and resources.</p>
          <p>
            This website brings together messages, contact information and
            links to public resources.
          </p>
          <ul>
            <li>
              <a href="https://calendly.com/alban-andrieu" target="_blank" rel="noopener noreferrer">
                Schedule a conversation
              </a>
            </li>
            <li>
              <a href="https://ko-fi.com/albandrieu" target="_blank" rel="noopener noreferrer">
                Support this site (Ko-fi)
              </a>
            </li>
          </ul>
        </div>
      </details>
    </section>
  );
}
