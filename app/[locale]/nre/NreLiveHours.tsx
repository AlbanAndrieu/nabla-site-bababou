"use client";

import { useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import { elapsedSeparationSeconds, nreInventoryStats } from "@/lib/nreVisitLedger.mjs";
import type { NreRow } from "@/lib/nreLegacyData";
import type { NrePageCopy } from "./sections";
import styles from "./page.module.css";

const NUMBER_LOCALE: Record<AppLocale, string> = {
  fr: "fr-FR", en: "en-GB", de: "de-DE", no: "nb-NO",
};

function clockString(value: number, locale: AppLocale) {
  const hours = new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(Math.floor(value / 3600));
  const minutes = String(Math.floor((value % 3600) / 60)).padStart(2, "0");
  const seconds = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/** The historical nominal visit total is separate from the civil separation
 * clock. Actual hours are unknown unless manually entered on this device.
 * Nothing from the form is persisted or transmitted.
 */
export default function NreLiveHours({
  copy, rows, locale,
}: { copy: NrePageCopy; rows: NreRow[]; locale: AppLocale }) {
  const [now, setNow] = useState<number | null>(null);
  const [contactHours, setContactHours] = useState("");

  useEffect(() => {
    const initial = window.requestAnimationFrame(() => setNow(Date.now()));
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(initial);
      window.clearInterval(interval);
    };
  }, []);

  const nominal = new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(
    nreInventoryStats(rows).theoreticalScheduledHours,
  );
  const elapsed = now === null ? null : elapsedSeparationSeconds(now, contactHours);

  return (
    <section className={styles.section} aria-labelledby="nre-hours-heading">
      <div className={styles.hoursPanel}>
        <div className={styles.hoursHeader}>
          <div>
            <h2 id="nre-hours-heading">{copy.hours.heading}</h2>
            <p className={styles.hoursIntro}>{copy.hours.intro}</p>
          </div>
          <span className={styles.liveIndicator}><span aria-hidden="true" />{copy.hours.live}</span>
        </div>
        <div className={styles.hoursNumbers}>
          <div className={`${styles.hoursItem} ${styles.hoursPrimary}`}>
            <span className={styles.hoursLabel}>{copy.hours.nominal}</span>
            <strong className={styles.hoursFigure}>{nominal} <small>h</small></strong>
            <p className={styles.hoursDetail}>{copy.hours.nominalHint}</p>
          </div>
          <div className={styles.hoursItem}>
            <span className={styles.hoursLabel}>{copy.hours.gross}</span>
            <strong className={styles.hoursFigure} aria-live="off">
              {elapsed ? clockString(elapsed.elapsed, locale) : "—"}
            </strong>
            <p className={styles.hoursDetail}>{copy.hours.elapsedHint}</p>
          </div>
          <div className={styles.hoursItem}>
            <span className={styles.hoursLabel}>{copy.hours.net}</span>
            <strong className={styles.hoursFigure} aria-live="off">
              {elapsed?.net == null ? copy.hours.unknown : clockString(elapsed.net, locale)}
            </strong>
            <p className={styles.hoursDetail}>{copy.hours.netHint}</p>
          </div>
        </div>
        <div className={styles.hoursForm}>
          <label className={styles.hoursInput}>
            <span>{copy.hours.actual}</span>
            <input
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              value={contactHours}
              onChange={(event) => setContactHours(event.target.value)}
              placeholder="0.00"
              aria-describedby="contact-hours-note"
            />
          </label>
          <p id="contact-hours-note" className={styles.hoursHint}>{copy.hours.actualHint}</p>
        </div>
        <details className={styles.methodology}>
          <summary>{copy.hours.methodology}</summary>
          <div className={styles.methodologyBody}>
            <p>{copy.hours.scope}</p>
            <p>{copy.hours.source}</p>
            <p>{copy.hours.suspension}</p>
            <p>{copy.hours.beforeOrder}</p>
            <p>{copy.hours.refresh}</p>
          </div>
        </details>
      </div>
    </section>
  );
}
