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
          <p>{copy.sitewideInstructions}</p>
        </div>
      ) : <p>{copy.sitewideWithoutReference}</p>}
      <p className={styles.accessCaution}>{copy.sitewidePublicNotice}</p>
      <a className={styles.registerRequestLink} href={contact}>{copy.contact}</a>
    </section>
  );
}
