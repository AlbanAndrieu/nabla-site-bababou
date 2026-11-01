"use client";

import { useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import { elapsedSeparationSeconds, estimateReportedContactHours } from "@/lib/nreVisitLedger.mjs";
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

/** A non-editable, owner-reported approximation of presence periods.
 * Vacation days count as calendar co-presence, not waking contact hours.
 * Undated Norwegian meetings are not silently counted.
 */
export default function NreLiveHours({
  copy, rows, locale,
}: { copy: NrePageCopy; rows: NreRow[]; locale: AppLocale }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const initial = window.requestAnimationFrame(() => setNow(Date.now()));
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(initial);
      window.clearInterval(interval);
    };
  }, []);

  const report = estimateReportedContactHours(rows);
  const subtotal = new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(report.subtotalHours);
  const elapsed = now === null ? null : elapsedSeparationSeconds(now, report.subtotalHours);

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
            <span className={styles.hoursLabel}>{copy.hours.contactEstimate}</span>
            <strong className={styles.hoursFigure}>{subtotal} <small>h</small></strong>
            <ul className={styles.contactBreakdown} aria-label={copy.hours.countriesLabel}>
              <li><span>🇫🇷 {copy.hours.franceLabel}</span><strong>{new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(report.franceCalendarHours)} h</strong></li>
              <li><span>🇩🇪 {copy.hours.germanyLabel}</span><strong>{report.germanyHours} h</strong></li>
              <li><span>🇳🇴 {copy.hours.norwayLabel}</span><strong>{report.norwayApproxHours} h</strong></li>
            </ul>
            <p className={styles.hoursDetail}>{copy.hours.contactEstimateHint}</p>
          </div>
          <div className={styles.hoursItem}>
            <span className={styles.hoursLabel}>{copy.hours.gross}</span>
            <strong className={styles.hoursFigure} aria-live="off">
              {elapsed ? clockString(elapsed.elapsed, locale) : "—"}
            </strong>
          </div>
          <div className={styles.hoursItem}>
            <span className={styles.hoursLabel}>{copy.hours.net}</span>
            <strong className={styles.hoursFigure} aria-live="off">
              {elapsed?.net == null ? "—" : clockString(elapsed.net, locale)}
            </strong>
            <p className={styles.hoursDetail}>{copy.hours.netHint}</p>
          </div>
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
