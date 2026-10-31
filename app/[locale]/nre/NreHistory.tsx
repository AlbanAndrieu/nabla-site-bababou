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
  useEffect(()=>{
    const refresh=()=>setAsOf(new Date().toISOString());
    refresh();
    const interval=window.setInterval(refresh,60_000);
    return ()=>window.clearInterval(interval);
  },[]);
  const rows=useMemo(()=>completeNreInventory(legacyRows,new Date(asOf)),[legacyRows,asOf]);
  const years=useMemo(()=>[...new Set(rows.map(row=>row.year))].reverse(),[rows]);
  const filteredRows=visibleYear==="all"?rows:rows.filter(row=>String(row.year)===visibleYear);
  return (
    <>
      <NreStats copy={copy} rows={rows}/>
      <NreLiveHours copy={copy} rows={rows} locale={locale}/>
      <NreReference copy={copy}/>
      <NreNote copy={copy}/>
      <NreTimeline copy={copy} rows={rows} locale={locale}/>
      <NreLocation copy={copy}/>
      <div className={styles.section}>
        <label className={styles.tableFilter}>{copy.table.filterYear}
          <select value={visibleYear} onChange={event=>setVisibleYear(event.target.value)}>
            <option value="all">{copy.table.filterAll}</option>
            {years.map(year=><option key={year} value={String(year)}>{year}</option>)}
          </select>
        </label>
      </div>
      <NreTable copy={copy} rows={filteredRows} locale={locale}/>
      <NreExceptions copy={copy} rows={rows} locale={locale}/>
    </>
  );
}
