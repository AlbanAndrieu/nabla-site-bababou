import type { AppLocale } from "@/i18n/routing";
import type { PolicyPageSlug } from "@/lib/policyPages";
import { localizedPolicyPath } from "@/lib/policyRoutePaths";
import styles from "./LegacyFooterSection.module.css";

const policySlugs = [
  "service_terms",
  "privacy_policy",
  "impressum",
  "accessibility_statement",
  "cookie_policy",
] as const satisfies readonly PolicyPageSlug[];

const labels = {
  fr: {
    title: "Mentions et politiques du site",
    nav: "Liens juridiques et accessibilité",
    links: ["Conditions d’utilisation", "Politique de confidentialité", "Mentions légales", "Accessibilité", "Politique des cookies"],
  },
  en: {
    title: "Site Policies",
    nav: "Legal and accessibility links",
    links: ["Terms of Use", "Privacy Policy", "Impressum", "Accessibility", "Cookie Policy"],
  },
  de: {
    title: "Rechtliche Hinweise und Richtlinien",
    nav: "Rechtliche Hinweise und Barrierefreiheit",
    links: ["Nutzungsbedingungen", "Datenschutzerklärung", "Impressum", "Barrierefreiheit", "Cookie-Richtlinie"],
  },
  no: {
    title: "Nettstedets retningslinjer",
    nav: "Juridiske lenker og tilgjengelighet",
    links: ["Bruksvilkår", "Personvernerklæring", "Juridisk informasjon", "Tilgjengelighet", "Retningslinjer for informasjonskapsler"],
  },
} as const;

/** One named legal-links section, in addition to the shared Next layout footer. */
export default function LegacyFooterSection({ locale = "en" }: { locale?: AppLocale }) {
  const t = labels[locale];
  return (
    <section id="preview-footer" className={styles.section} lang={locale} aria-labelledby="preview-policies-heading">
      <h2 id="preview-policies-heading">{t.title}</h2>
      <nav aria-label={t.nav}>
        <ul className={styles.links}>
          {policySlugs.map((slug, index) => (
            <li key={slug}><a href={localizedPolicyPath(slug, locale)}>{t.links[index]}</a></li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
