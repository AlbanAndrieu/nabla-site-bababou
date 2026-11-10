"use client";

import { useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import type { NrePageCopy } from "../nre/sections";
import styles from "../nre/page.module.css";

const PUBLIC_DOCUMENT_REF = /^SITE-DOC-[0-9a-f]{16}$/;

export default function DocumentRequestSelection({
  locale,
  copy,
}: { locale: AppLocale; copy: NrePageCopy["access"] }) {
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const actions: Record<AppLocale, { copy: string; copied: string }> = {
    fr: { copy: "Copier la référence", copied: "Référence copiée" },
    en: { copy: "Copy reference", copied: "Reference copied" },
    de: { copy: "Referenz kopieren", copied: "Referenz kopiert" },
    no: { copy: "Kopier referanse", copied: "Referanse kopiert" },
  };
  async function copyReference() {
    if (!reference || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
    } catch {
      // Clipboard permissions are browser-dependent: never claim success.
      setCopied(false);
    }
  }
  useEffect(() => {
    // Public locator only, never a private URL or an authentication token.
    const candidate = new URLSearchParams(window.location.search).get("doc");
    setReference(candidate && PUBLIC_DOCUMENT_REF.test(candidate) ? candidate : null);
  }, []);
  const contact = `${locale === "fr" ? "" : `/${locale}`}/contact#contact-details`;
  return (
    <section id="request-documents" className={styles.section} aria-labelledby="request-documents-heading">
      <h2 id="request-documents-heading">{copy.sitewideHeading}</h2>
      <p>{copy.sitewideIntro}</p>
      {reference ? (
        <div className={styles.accessSelection} data-testid="site-document-reference">
          <strong>{copy.sitewideReference}</strong>
          <code>{reference}</code>
          <button type="button" className={styles.registerRequestLink} onClick={copyReference}>
            {actions[locale].copy}
          </button>
          <span role="status" aria-live="polite">{copied ? actions[locale].copied : ""}</span>
          <p>{copy.sitewideInstructions}</p>
        </div>
      ) : <p>{copy.sitewideWithoutReference}</p>}
      <p className={styles.accessCaution}>{copy.sitewidePublicNotice}</p>
      <a className={styles.registerRequestLink} href={contact}>{copy.contact}</a>
    </section>
  );
}
