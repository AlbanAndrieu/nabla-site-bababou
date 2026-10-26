import { POLICY_PAGES } from "@/lib/policyPages";
import styles from "./LegacyFooterSection.module.css";

// Keep approved English labels. Canonical paths come from the shared SEO registry.
const policyLinks = [
  { label: "Terms of Use", href: POLICY_PAGES.service_terms.canonicalPath },
  { label: "Privacy Policy", href: POLICY_PAGES.privacy_policy.canonicalPath },
  { label: "Impressum", href: POLICY_PAGES.impressum.canonicalPath },
  { label: "Accessibility", href: POLICY_PAGES.accessibility_statement.canonicalPath },
  { label: "Cookie Policy", href: POLICY_PAGES.cookie_policy.canonicalPath },
] as const;

/**
 * This section sits inside the preview's main element.
 * The shared Next layout already renders the document's single site footer.
 */
export default function LegacyFooterSection() {
  return (
    <section
      id="preview-footer"
      className={styles.section}
      lang="en"
      aria-labelledby="preview-policies-heading"
    >
      <h2 id="preview-policies-heading">Site Policies</h2>
      <nav aria-label="Legal and accessibility links">
        <ul className={styles.links}>
          {policyLinks.map(({ label, href }) => (
            <li key={href}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
