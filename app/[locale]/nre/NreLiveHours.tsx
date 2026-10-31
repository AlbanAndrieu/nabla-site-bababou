"use client";

import { useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import { elapsedSeparationSeconds, nreInventoryStats } from "@/lib/nreVisitLedger.mjs";
import type { NreRow } from "@/lib/nreLegacyData";
import type { NrePageCopy } from "./sections";
import styles from "./page.module.css";

const NUMBER_LOCALE: Record<AppLocale,string> = {fr:"fr-FR",en:"en-GB",de:"de-DE",no:"nb-NO"};
function clockString(value: number, locale: AppLocale) {
  const h=Math.floor(value/3600);
  const m=String(Math.floor(value%3600/60)).padStart(2,"0");
  const s=String(value%60).padStart(2,"0");
  return new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(h)+":"+m+":"+s;
}

/**
 * A real-time elapsed-time indicator, explicitly distinct from proven NRE.
 * No automatic storage of the manually supplied actual contact duration.
 * Unknown contact duration => no invented net total.
 */
export default function NreLiveHours({copy,rows,locale}:{copy:NrePageCopy;rows:NreRow[];locale:AppLocale}) {
  const [now,setNow]=useState<number|null>(null);
  const [contactHours,setContactHours]=useState("");
  useEffect(()=>{
    setNow(Date.now());
    const interval=window.setInterval(()=>setNow(Date.now()),1000);
    return ()=>window.clearInterval(interval);
  },[]);
  const reported=nreInventoryStats(rows);
  const time=now===null?null:elapsedSeparationSeconds(now,contactHours);
  const net=time?.net??null;
  return (
    <section className={styles.section} aria-labelledby="nre-hours-heading">
      <div className={styles.hoursPanel}>
        <h2 id="nre-hours-heading">{copy.hours.heading}</h2>
        <div className={styles.hoursNumbers}>
          <div className={styles.hoursItem}>
            <span>{copy.hours.gross}</span>
            <strong className={styles.hoursFigure} aria-live="off" suppressHydrationWarning>{time?clockString(time.elapsed,locale):"—"}</strong>
          </div>
          <div className={styles.hoursItem}>
            <span>{copy.hours.nominal}</span>
            <strong className={styles.hoursFigure}>{new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(reported.theoreticalScheduledHours)} h</strong>
          </div>
          <div className={styles.hoursItem}>
            <span>{copy.hours.net}</span>
            <strong className={styles.hoursFigure} aria-live="off" suppressHydrationWarning>{net===null?copy.hours.unknown:clockString(net,locale)}</strong>
          </div>
        </div>
        <label className={styles.hoursInput}>
          <span>{copy.hours.actual}</span>
          <input type="number" min="0" step="0.25" value={contactHours} onChange={event=>setContactHours(event.target.value)} placeholder="0.00" aria-describedby="contact-hours-note" />
        </label>
        <p id="contact-hours-note" className={styles.hoursHint}>{copy.hours.actualHint}</p>
        <p className={styles.hoursHint}>{copy.hours.scope}</p>
        <p className={styles.hoursHint}>{copy.hours.source}</p>
        <p className={styles.hoursHint}>{copy.hours.refresh}</p>
      </div>
    </section>
  );
}
