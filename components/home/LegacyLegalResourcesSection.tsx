import type { AppLocale } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

import styles from "./LegacyLegalResourcesSection.module.css";

/**
 * Keep access to the publicly available legacy legal resources.
 * Only descriptions and links are rendered here: never import the
 * underlying case records or personal information into the review.
 */
const resourcesFor = (locale: AppLocale) => [
  {
    href: "/for-fathers.html",
    title: "Information for fathers",
    detail: "European legal framework and existing public resources.",
  },
  {
    href: canonicalPagePath("nre", locale),
    title: "NRE — France",
    detail: "Read the published NRE page in your selected language.",
  },
  {
    href: canonicalPagePath("central-authorities", locale),
    title: "Central Authorities",
    detail: "Consult the published central-authority resource page.",
  },
] as const;

export default function LegacyLegalResourcesSection({ locale }: { locale: AppLocale }) {
  const resources = resourcesFor(locale);
  return (
    <section
      id="preview-legal-resources"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-legal-resources-heading"
    >
      <h2 id="preview-legal-resources-heading">Legal framework and resources</h2>
      <p>
        Information for parents in difficulty: European legal framework (France, Norway, Germany), international
        conventions, parental alienation, demands for shared custody and enforcement of visitation rights — and a
        call for international action.
      </p>
      <ul className={styles.resources}>
        {resources.map(({ href, title, detail }) => (
          <li key={href}>
            <a href={href}>{title}</a>
            <p>{detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
