import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import PublishedAuthorityCorrespondence from "@/components/documents/PublishedAuthorityCorrespondence";
import { routing } from "@/i18n/routing";
import styles from "./page.module.css";
import "./page.css";

export const dynamic = "force-static";

const TITLE = "Demande d'explications écrites des autorités compétentes";
const DESCRIPTION = "Fil d’échanges publiés avec l’Autorité centrale française au sujet de la Convention de La Haye de 1980.";

export async function generateMetadata({ params }: PageProps<"/[locale]/ca/demande-explications-autorites-competentes-fr">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return {
    title: TITLE,
    description: DESCRIPTION,
    // The historical approved HTML is still the public canonical until a
    // separate exact-SHA parity/redirect release is authorized.
    robots: { index: false, follow: true },
    alternates: { canonical: "/ca/demande-explications-autorites-competentes-fr.html" },
  };
}

export default async function PublishedCentralAuthorityCorrespondence({
  params,
}: PageProps<"/[locale]/ca/demande-explications-autorites-competentes-fr">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <>
      <TopAnchor />
      <main id="main-content" className={styles.page}>
        <Container>
          <nav className={styles.actions} aria-label="Navigation documentaire">
            <Link href={locale === "fr" ? "/central-authorities" : `/${locale}/central-authorities`}>
              Autorités centrales
            </Link>
            <a href="/ca/demande-explications-autorites-competentes-fr.html">
              Archive HTML approuvée
            </a>
            <a href="/ca/demande-explications-autorites-competentes-en.html" hrefLang="en">
              English archive
            </a>
          </nav>
          <p className={styles.notice}>
            Transcription React d’une page déjà publiée. Texte d’origine en français,
            conservé sans traduction automatique des échanges. Les propos cités
            sont attribués à leurs auteurs et ne constituent pas des constatations judiciaires.
          </p>
          <div className={styles.document} lang="fr">
            <PublishedAuthorityCorrespondence />
          </div>
        </Container>
      </main>
    </>
  );
}
