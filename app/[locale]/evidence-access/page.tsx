import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import Container from "@/components/ui/Container";
import TopAnchor from "@/components/TopAnchor";
import publicRegister from "@/data/nre-evidence.public.json";
import { type AppLocale, routing } from "@/i18n/routing";
import { assertPublicEvidenceRegister } from "@/lib/nrePublicEvidence.mjs";
import { pageAlternates } from "@/lib/sitePageCatalog";
import type { NrePageCopy } from "../nre/sections";
import styles from "../nre/page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/evidence-access">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  setRequestLocale(locale);
  const { nrePage } = await getMessages({ locale });
  const t = (nrePage as unknown as NrePageCopy).access;
  // This legal/evidentiary page must not inherit homepage recognition imagery.
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: pageAlternates("evidence-access", locale),
    robots: { index: true, follow: true },
    openGraph: { title: t.metaTitle, description: t.metaDescription, images: [] },
    twitter: { card: "summary", title: t.metaTitle, description: t.metaDescription, images: [] },
  };
}

type Entry = {
  id: string;
  jurisdiction: "FR" | "NO" | "DE" | "MULTI";
  kind: "complaint" | "contact-request";
  evidenceStatus: "unlinked" | "reviewed-public-reference";
  publicProofRefs: string[];
};
type Proof = { id: string; title: Record<AppLocale, string>; claimIds: string[] };
const register = assertPublicEvidenceRegister(publicRegister);
const entries = register.entries as Entry[];
const proofs = register.proofs as Proof[];

export default async function EvidenceAccessPage({ params }: PageProps<"/[locale]/evidence-access">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { nrePage } = await getMessages({ locale });
  const t = (nrePage as unknown as NrePageCopy).access;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const steps = [
    [t.step1Title, t.step1Body],
    [t.step2Title, t.step2Body],
    [t.step3Title, t.step3Body],
    [t.step4Title, t.step4Body],
  ] as const;
  const regions = { FR: t.france, NO: t.norway, DE: t.germany, MULTI: t.contactRequests };

  return (
    <>
      <TopAnchor />
      <main id="main-content" className={styles.page}>
        <Container>
          <header className={styles.accessHero}>
            <p className={styles.accessEyebrow}>{t.eyebrow}</p>
            <h1>{t.heading}</h1>
            <p className={styles.accessLead}>{t.intro}</p>
            <p className={styles.accessPending} role="status">{t.pending}</p>
            <nav className={styles.accessLinks} aria-label={t.navigation}>
              <a href={`${prefix}/contact#contact-details`}>{t.contact}</a>
              <a href={`${prefix}/nre#nre-register`}>{t.backToRegister}</a>
            </nav>
          </header>

          <section className={styles.section} aria-labelledby="evidence-process-heading">
            <h2 id="evidence-process-heading">{t.processHeading}</h2>
            <ol className={styles.accessSteps}>
              {steps.map(([title, body], index) => (
                <li key={title} className={styles.accessStep}>
                  <span aria-hidden="true" className={styles.accessStepNumber}>{index + 1}</span>
                  <div><h3>{title}</h3><p>{body}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.section} aria-labelledby="evidence-catalog-heading">
            <h2 id="evidence-catalog-heading">{t.catalogHeading}</h2>
            <p>{t.catalogIntro}</p>
            <ol className={styles.accessCatalog} data-testid="nre-access-catalog">
              {entries.map(entry => (
                <li key={entry.id} id={entry.id} className={styles.accessEntry}>
                  <h3>{regions[entry.jurisdiction]}</h3>
                  <code>{entry.id}</code>
                  <p>{t.entryDetails}</p>
                  <p className={styles.registerStatus}>
                    {entry.evidenceStatus === "unlinked" ? t.notYetLinked : t.reviewedRef}
                  </p>
                  {entry.publicProofRefs.length > 0 && (
                    <ul>
                      {entry.publicProofRefs.map(ref => (
                        <li key={ref}><a href={`#${ref}`}>{ref}</a></li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
            {proofs.length > 0 ? (
              <section aria-labelledby="evidence-reviewed-heading">
                <h3 id="evidence-reviewed-heading">{t.reviewedHeading}</h3>
                <ul className={styles.accessCatalog}>
                  {proofs.map(proof => (
                    <li key={proof.id} id={proof.id} className={styles.accessEntry}>
                      <h4>{proof.title[locale]}</h4>
                      <code>{proof.id}</code>
                      <p>{t.requestOnly}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : <p className={styles.accessPending}>{t.noApprovedProofs}</p>}
          </section>

          <section className={styles.section} aria-labelledby="evidence-safety-heading">
            <h2 id="evidence-safety-heading">{t.securityHeading}</h2>
            <p>{t.securityBody}</p>
            <p>{t.existingPublicPdf}</p>
            <p className={styles.accessCaution}>{t.noAutomaticApproval}</p>
            <nav className={styles.accessLinks} aria-label={t.navigation}>
              <a href={`${prefix}/contact#contact-details`}>{t.contact}</a>
              <a href={`${prefix}/nre#nre-register`}>{t.backToRegister}</a>
            </nav>
          </section>
        </Container>
      </main>
    </>
  );
}
