import publicRegister from "@/data/nre-evidence.public.json";
import type { AppLocale } from "@/i18n/routing";
import { assertPublicEvidenceRegister } from "@/lib/nrePublicEvidence.mjs";

import type { NrePageCopy } from "./sections";
import styles from "./page.module.css";

type PublicClaim = {
  id: string;
  jurisdiction: "FR" | "NO" | "DE" | "MULTI";
  kind: "complaint" | "contact-request";
  assertionStatus: "owner-reported" | "document-reviewed";
  evidenceStatus: "unlinked" | "reviewed-public-reference";
  publicProofRefs: string[];
};
type PublicProof = {
  id: string;
  title: Record<AppLocale, string>;
};

const register = assertPublicEvidenceRegister(publicRegister);
const entries = register.entries as PublicClaim[];
const proofs = register.proofs as PublicProof[];

const flags: Record<PublicClaim["jurisdiction"], string> = {
  FR: "🇫🇷", NO: "🇳🇴", DE: "🇩🇪", MULTI: "🗂️",
};

export default function NreEvidenceRegister({
  copy, locale,
}: { copy: NrePageCopy; locale: AppLocale }) {
  const t = copy.register;
  const contactHref = `${locale === "fr" ? "" : `/${locale}`}/contact#contact-details`;
  const titles: Record<PublicClaim["jurisdiction"], string> = {
    FR: t.france, NO: t.norway, DE: t.germany, MULTI: t.contactRequests,
  };

  return (
    <section className={styles.section} aria-labelledby="nre-register-heading" id="nre-register">
      <div className={styles.registerHeader}>
        <div>
          <h2 id="nre-register-heading">{t.heading}</h2>
          <p>{t.intro}</p>
        </div>
        <p className={styles.registerSecurity}>{t.privateNotice}</p>
      </div>
      <ol className={styles.registerCards} data-testid="nre-evidence-register">
        {entries.map(entry => (
          <li key={entry.id} className={styles.registerCard} data-country={entry.jurisdiction}>
            <div className={styles.registerCardHeading}>
              <span aria-hidden="true">{flags[entry.jurisdiction]}</span>
              <h3>{titles[entry.jurisdiction]}</h3>
            </div>
            <p className={styles.registerReference}>{entry.id}</p>
            <p>{entry.kind === "contact-request" ? t.requestsReported : t.complaintReported}</p>
            <p className={styles.registerStatus}>
              {entry.evidenceStatus === "unlinked" ? t.pendingProof : t.reviewedProof}
            </p>
            {entry.publicProofRefs.length > 0 && (
              <ul className={styles.registerProofs}>
                {entry.publicProofRefs.map(ref => {
                  const proof = proofs.find(item => item.id === ref);
                  return proof ? (
                    <li key={ref}>
                      <strong>{ref}</strong> — {proof.title[locale]} · {t.requestOnly}
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <div className={styles.registerFooter}>
        <div>
          <h3>{t.requestHeading}</h3>
          <p>{t.requestInstructions}</p>
          <p className={styles.registerFootnote}>{t.disclaimer}</p>
        </div>
        <a className={styles.registerRequestLink} href={contactHref}>{t.requestLink}</a>
      </div>
    </section>
  );
}
