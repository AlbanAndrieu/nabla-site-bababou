"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import type { NreRow } from "@/lib/nreLegacyData";
import { completeNreInventory } from "@/lib/nreVisitLedger.mjs";
import {
 NreExceptions,NreLocation,NreNote,NreReference,NreStats,NreTable,NreTimeline,
 type NrePageCopy,
} from "./sections";
import NreLiveHours from "./NreLiveHours";
import styles from "./page.module.css";

/** Keep an old static build current after midnight in the Paris timezone. */
export default function NreHistory({copy,legacyRows,locale,buildDate}:{
 copy:NrePageCopy;legacyRows:NreRow[];locale:AppLocale;buildDate:string;
}) {
  const [asOf,setAsOf]=useState(buildDate);
  const [visibleYear,setVisibleYear]=useState("all");
  const [visibleStatus,setVisibleStatus]=useState("all-statuses");
  useEffect(()=>{
    const refresh=()=>setAsOf(new Date().toISOString());
    const initial=window.requestAnimationFrame(refresh);
    const interval=window.setInterval(refresh,60_000);
    return ()=>{window.cancelAnimationFrame(initial);window.clearInterval(interval);};
  },[]);
  const rows=useMemo<NreRow[]>(()=>completeNreInventory(legacyRows,new Date(asOf)) as NreRow[],[legacyRows,asOf]);
  const years=useMemo<number[]>(()=>[...new Set<number>(rows.map((row:NreRow)=>row.year))].reverse(),[rows]);
  const filteredRows=rows.filter(row =>
    (visibleYear==="all" || String(row.year)===visibleYear) &&
    (visibleStatus==="all-statuses" || (visibleStatus==="review"
      ? row.status==="review" || row.status==="beforeOrder"
      : row.status===visibleStatus))
  );
  return (
    <>
      <NreStats copy={copy} rows={rows}/>
      <NreLiveHours copy={copy} rows={rows} locale={locale}/>
      <NreReference copy={copy}/>
      <NreNote copy={copy}/>
      <div className={`${styles.section} ${styles.calendarFilters}`} role="group" aria-label={copy.timeline.filters}>
        <label className={styles.tableFilter}>{copy.table.filterYear}
          <select value={visibleYear} onChange={event=>setVisibleYear(event.target.value)}>
            <option value="all">{copy.table.filterAll}</option>
            {years.map(year=><option key={year} value={String(year)}>{year}</option>)}
          </select>
        </label>
        <label className={styles.tableFilter}>{copy.table.filterStatus}
          <select value={visibleStatus} onChange={event=>setVisibleStatus(event.target.value)}>
            <option value="all-statuses">{copy.table.filterAllStatuses}</option>
            <option value="nre">{copy.table.nre}</option>
            <option value="exception">{copy.table.exception}</option>
            <option value="review">{copy.table.review}</option>
          </select>
        </label>
        <div className={styles.calendarFilterFeedback}>
          <output className={styles.calendarResults} aria-live="polite" aria-atomic="true">
            {copy.table.resultsCount}: <strong>{filteredRows.length}</strong>
          </output>
          {(visibleYear !== "all" || visibleStatus !== "all-statuses") && (
            <button type="button" className={styles.calendarReset} onClick={() => {
              setVisibleYear("all");
              setVisibleStatus("all-statuses");
            }}>
              {copy.table.resetFilters}
            </button>
          )}
        </div>
      </div>
      <NreTimeline copy={copy} rows={filteredRows} locale={locale}/>
      <NreLocation copy={copy}/>
      <NreTable copy={copy} rows={filteredRows} locale={locale}/>
      {filteredRows.some(row=>row.status==="exception") && <NreExceptions copy={copy} rows={filteredRows} locale={locale}/>}
    </>
  );
}
