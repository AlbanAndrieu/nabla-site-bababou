"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./LegacyAssociationsSection.module.css";

/** Public association references and bundled artwork from public/index.html. */
const ASSOCIATIONS = [
  {
    id: "paternet",
    name: "Paternet",
    initials: "P",
    href: "http://paternet.fr/tag/combat-des-peres//",
    iconSrc: "/assets/auction-law-svgrepo-com.svg",
    iconWidth: 70,
  },
  {
    id: "sos-papa",
    name: "SOS Papa",
    initials: "SP",
    href: "http://www.sospapa.net/",
    iconSrc: "/assets/sos-warning-svgrepo-com.svg",
    iconWidth: 100,
  },
  {
    id: "sos-parents-japan",
    name: "SOS Parents Japan",
    initials: "SJ",
    href: "http://sos-parents-japan.org/",
    iconSrc: "/assets/japan-kanji-svgrepo-com.svg",
    iconWidth: 70,
  },
] as const;

export default function LegacyAssociationsSection({ locale = "en" }: { locale?: "fr" | "en" | "de" | "no" }) {
  const headings = {
    fr: "Associations que je soutiens",
    en: "Associations I support",
    de: "Organisationen, die ich unterstütze",
    no: "Organisasjoner jeg støtter",
  } as const;
  const [failedIcons, setFailedIcons] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  return (
    <section
      id="preview-associations"
      className={styles.section}
      lang={locale}
      aria-labelledby="preview-associations-heading"
    >
      <h2 id="preview-associations-heading">{headings[locale]}</h2>
      <ul className={styles.list}>
        {ASSOCIATIONS.map(({ id, name, initials, href, iconSrc, iconWidth }) => (
          <li key={id}>
            <a
              className={styles.link}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.icon} aria-hidden="true">
                {failedIcons.has(id) ? (
                  <span
                    className={styles.monogram}
                    data-association-icon-fallback={id}
                  >
                    {initials}
                  </span>
                ) : (
                  <Image
                    src={iconSrc}
                    alt=""
                    width={iconWidth}
                    height={70}
                    unoptimized
                    onError={() =>
                      setFailedIcons((previous) => new Set(previous).add(id))
                    }
                  />
                )}
              </span>
              <span>{name}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
