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

/** Keep an old static build current after midnight in the Paris timezone. */
export default function NreHistory({copy,legacyRows,locale,buildDate}:{
 copy:NrePageCopy;legacyRows:NreRow[];locale:AppLocale;buildDate:string;
}) {
  const [asOf,setAsOf]=useState(buildDate);
  useEffect(()=>{
    const refresh=()=>setAsOf(new Date().toISOString());
    refresh();
    const interval=window.setInterval(refresh,60_000);
    return ()=>window.clearInterval(interval);
  },[]);
  const rows=useMemo(()=>completeNreInventory(legacyRows,new Date(asOf)),[legacyRows,asOf]);
  return (
    <>
      <NreStats copy={copy} rows={rows}/>
      <NreLiveHours copy={copy} rows={rows} locale={locale}/>
      <NreReference copy={copy}/>
      <NreNote copy={copy}/>
      <NreTimeline copy={copy} rows={rows} locale={locale}/>
      <NreLocation copy={copy}/>
      <NreTable copy={copy} rows={rows} locale={locale}/>
      <NreExceptions copy={copy} rows={rows} locale={locale}/>
    </>
  );
}
