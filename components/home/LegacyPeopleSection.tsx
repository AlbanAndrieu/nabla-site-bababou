import styles from "./LegacyPeopleSection.module.css";

/**
 * Keep the legacy public resource pages available without copying names,
 * personal records or claims about third parties into the React review.
 */
export default function LegacyPeopleSection() {
  return (
    <section
      id="preview-people"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-people-heading"
    >
      <h2 id="preview-people-heading">People I contacted</h2>
      <p>
        The public archive describes outreach to people and institutions.
        Open the existing resources for more detail; the underlying records
        have not been copied into this review page.
      </p>
      <ul className={styles.resources}>
        <li>
          <a href="/people-contacted.html">People contacted</a>
          <p>Open the existing public overview and interactive visualization.</p>
        </li>
        <li>
          <a href="/central-authorities.html">Central Authorities</a>
          <p>Browse the existing central-authority resource page.</p>
        </li>
      </ul>
    </section>
  );
}
