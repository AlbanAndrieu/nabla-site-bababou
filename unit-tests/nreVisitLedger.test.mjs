import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
 firstWeekend,nreWeekendStrip,nreMonthCalendar,completeNreInventory,nreInventoryStats,
 elapsedSeparationSeconds,estimateReportedContactHours,NRE_REPORTED_CONTACT,NRE_REPORTED_ORDER,NRE_REPORTED_SUSPENSION,
} from "../lib/nreVisitLedger.mjs";

const locales=["fr","en","de","no"];
const read=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

function legacyFixture(){
 const rows=[];
 for(let year=2017;year<=2026;year++) for(let month=1;month<=12;month++){
  if(year===2017&&month<3 || year===2026&&month>2)continue;
  const wk=firstWeekend(year,month);
  const exception=[[2020,1],[2021,8],[2021,10],[2022,1],[2022,3],[2022,11]]
    .some(([y,m])=>y===year&&m===month);
  rows.push({year,month,startDay:wk.startDay,endDay:wk.endDay,status:exception?"exception":"nre",statusDetail:exception?"Partial/visit":"NRE"});
 }
 return rows;
}

test("first weekend obeys UTC calendar including leap years",()=>{
 assert.deepEqual([firstWeekend(2017,4).startDay,firstWeekend(2017,4).endDay],[1,2]);
 assert.deepEqual([firstWeekend(2026,3).startDay,firstWeekend(2026,3).endDay],[7,8]);
 assert.deepEqual([firstWeekend(2026,10).startDay,firstWeekend(2026,10).endDay],[3,4]);
 assert.deepEqual([firstWeekend(2026,11).startDay,firstWeekend(2026,11).endDay],[7,8]);
 assert.throws(()=>firstWeekend(2026,13),RangeError);
});

test("as of 31 October 2026: 108 archive rows, 8 new review dates, never auto NRE",()=>{
 const base=legacyFixture();assert.equal(base.length,108);
 const rows=completeNreInventory(base,new Date("2026-10-31T12:00:00Z"));
 assert.equal(rows.length,116);
 const stats=nreInventoryStats(rows);
 assert.deepEqual(stats,{total:116,recordedMissed:101,partialOrHonored:6,unverified:8,beforeOrder:1,theoreticalScheduledHours:1010});
 assert.equal(rows[0].status,"beforeOrder");
 assert.equal(rows.at(-1).status,"review");
 assert.deepEqual([rows.at(-1).year,rows.at(-1).month,rows.at(-1).startDay,rows.at(-1).endDay],[2026,10,3,4]);
 const newer=rows.filter(r=>r.year===2026&&r.month>=3);
 assert.ok(newer.every(r=>r.status==="review"));
 assert.equal(NRE_REPORTED_ORDER.monthlyWeekendHours,10);
 assert.equal(NRE_REPORTED_SUSPENSION.verified,false);
});

test("the ledger follows future Paris dates but never predicts offenses",()=>{
 const base=legacyFixture();
 const beforeNovember=completeNreInventory(base,new Date("2026-11-07T10:00:00Z"));
 assert.equal(beforeNovember.length,116); // November weekend has not ended
 const afterNovember=completeNreInventory(base,new Date("2026-11-09T12:00:00Z"));
 assert.equal(afterNovember.length,117);
 assert.equal(afterNovember.at(-1).status,"review");
 assert.equal(completeNreInventory(afterNovember,new Date("2026-11-09T12:00:00Z")).length,117);
});

test("Sunday is not complete until Monday in Europe/Paris (winter and summer time)",()=> {
 const base=legacyFixture();
 // Winter: Monday begins at 23:00 UTC on Sunday.
 assert.equal(completeNreInventory(base,new Date("2026-11-08T22:59:59Z")).length,116);
 assert.equal(completeNreInventory(base,new Date("2026-11-08T23:00:01Z")).length,117);
 // Summer: Monday begins at 22:00 UTC on Sunday.
 assert.equal(completeNreInventory(base,new Date("2026-04-05T21:59:59Z")).length,109);
 assert.equal(completeNreInventory(base,new Date("2026-04-05T22:00:01Z")).length,110);
});

test("reported contact subtotal excludes unknown Norwegian weekends and missed contact", () => {
 const rows = legacyFixture();
 const expected={
  franceVacationDays:42,franceCalendarHours:1008,germanyHours:25,
  norwayReportedMeetingsApprox:3,norwayApproxHours:3,norwayDatesUnverified:true,
  subtotalHours:1036,measuredContactHours:null,
 };
 assert.deepEqual(estimateReportedContactHours(rows),expected);
 assert.equal(NRE_REPORTED_CONTACT.norwegianBriefContactHours,1);
 assert.equal(NRE_REPORTED_CONTACT.norwegianBriefMeetingsApprox,3);
 assert.deepEqual(estimateReportedContactHours(
   completeNreInventory(rows,new Date("2026-11-09T12:00:00Z"))),expected);
 // A weekend marked NRE cannot be treated as an actual one-hour encounter.
 assert.deepEqual(estimateReportedContactHours(rows.filter(r=>r.status==="nre")),expected);
 assert.throws(()=>estimateReportedContactHours(null),TypeError);
});

test("calendar strips mark both weekend days without inventing other-month dates", () => {
 assert.deepEqual(nreWeekendStrip(firstWeekend(2026,3)),[2,3,4,5,6,7,8]);
 assert.deepEqual(nreWeekendStrip(firstWeekend(2026,8)),[null,null,null,null,null,1,2]);
 assert.deepEqual(nreWeekendStrip(firstWeekend(2026,10)),[null,null,null,1,2,3,4]);
 assert.equal(nreWeekendStrip(firstWeekend(2026,11)).length,7);
 assert.throws(() => nreWeekendStrip({year:2026,month:11,startDay:2,endDay:3}),RangeError);
});

test("month calendars have 28–42 days in complete Monday-first rows", () => {
  const leap = firstWeekend(2024,2);
  const leapDays = nreMonthCalendar(leap);
  assert.equal(leapDays.length,35);
  assert.deepEqual(leapDays.slice(0,7),[null,null,null,1,2,3,4]);
  assert.equal(leapDays.filter(day=>day!==null).length,29);
  assert.deepEqual(leapDays.slice(-6),[27,28,29,null,null,null]);
  const august=firstWeekend(2026,8);
  const augustDays=nreMonthCalendar(august);
  assert.equal(augustDays.length,42);
  assert.deepEqual(augustDays.slice(0,7),[null,null,null,null,null,1,2]);
  assert.equal(augustDays.filter(day=>day!==null).length,31);
  assert.equal(augustDays.filter(day=>day===august.startDay||day===august.endDay).length,2);
  const november=firstWeekend(2026,11);
  assert.equal(nreMonthCalendar(november).length,42);
  assert.throws(()=>nreMonthCalendar({year:2026,month:11,startDay:2,endDay:3}),RangeError);
});

test("realtime clock never invents actual-contact hours",()=>{
 const time=Date.parse("2015-06-06T00:00:00.000Z")+3600_000*100;
 assert.deepEqual(elapsedSeparationSeconds(time),{elapsed:360000,net:null});
 assert.deepEqual(elapsedSeparationSeconds(time,12.5),{elapsed:360000,net:315000});
 assert.deepEqual(elapsedSeparationSeconds(time,""),{elapsed:360000,net:null});
 assert.deepEqual(elapsedSeparationSeconds(time,101),{elapsed:360000,net:null});
 assert.deepEqual(elapsedSeparationSeconds(time,-1),{elapsed:360000,net:null});
 assert.equal(elapsedSeparationSeconds(time+1000,12.5).net,315001);
 assert.deepEqual(elapsedSeparationSeconds(time,"12.5"),{elapsed:360000,net:315000});
 assert.deepEqual(elapsedSeparationSeconds(time,"0"),{elapsed:360000,net:360000});
 for(const invalid of [" ","1e1","0x10","NaN",true,[],{},-1,101,Infinity]){
  assert.equal(elapsedSeparationSeconds(time,invalid).net,null,String(invalid));
 }
 assert.throws(()=>elapsedSeparationSeconds(NaN,0),TypeError);
 assert.throws(()=>elapsedSeparationSeconds(Infinity,0),TypeError);
});

test("all four native languages have complete dashboard/status/filter copy",()=>{
 const names=["meta","hero","advocacy","stats","reference","note","timeline","table","exceptions","hours"];
 const objects=locales.map(locale=>JSON.parse(read("messages/nre/"+locale+".json")).nrePage);
 for(const name of names){
  const expected=Object.keys(objects[0][name]).sort();
  for(let i=0;i<locales.length;i++){
   assert.deepEqual(Object.keys(objects[i][name]).sort(),expected,locales[i]+" "+name);
   for(const [key,value] of Object.entries(objects[i][name])){
    assert.ok(typeof value==="string"&&value.trim().length>=3,locales[i]+" "+name+"."+key);
   }
  }
 }
 assert.equal(objects[0].stats.days,undefined);
 assert.equal(objects[0].stats.review,undefined);
 assert.equal(objects[0].hero.lead,undefined);
 assert.equal(objects[0].hours.elapsedHint,undefined);
 assert.ok(objects.every(c=>c.hours.contactEstimate&&c.hours.contactEstimateHint));
 assert.ok(objects.every(c=>c.hours.countriesLabel&&c.hours.franceLabel&&c.hours.germanyLabel&&c.hours.norwayLabel));
 assert.ok(objects.every(c=>c.table.filterYear&&c.table.review&&c.table.filterStatus&&c.table.filterAllStatuses&&c.table.resultsCount&&c.table.resetFilters&&c.timeline.viewDetails&&c.timeline.empty&&c.hours.contactEstimateHint));
 assert.ok(objects.every(c=>c.reference.prefix.includes("2017")&&c.exceptions.extendedStay));
 assert.ok(objects.every(c=>c.reference.heading&&c.reference.prefix&&c.reference.judgment));
 assert.ok(objects.every(c=>c.advocacy.heading&&c.advocacy.emphasis&&c.advocacy.evidenceNotice));
 assert.ok(objects.every(c=>c.advocacy.countries.includes(" · ")&&c.advocacy.lead.includes("2017")));
 assert.ok(objects.every(c=>c.note.expand&&c.note.p1&&c.note.p2&&c.note.p3));
 assert.ok(objects.every(c=>c.advocacy.rightsLink&&c.advocacy.opinion));

 assert.ok(objects.every(c=>c.exceptions.genericDetail&&c.exceptions.otherWeekend));
 assert.ok(objects.every(c=>c.hours.actual===undefined&&c.hours.nominal===undefined));
});

test("the public page uses live client recomputation and retains legal source",()=>{
 const page=read("app/[locale]/nre/page.tsx");
 const history=read("app/[locale]/nre/NreHistory.tsx");
 const hours=read("app/[locale]/nre/NreLiveHours.tsx");
 assert.match(page,/<NreHistory /);
 assert.match(page,/<NreAdvocacy copy=\{copy\}/);

 assert.match(history,/completeNreInventory/);
 assert.match(history,/60_000/);
 assert.match(history,/visibleStatus/);
 assert.match(history,/all-statuses/);
 assert.match(history,/calendarFilterFeedback/);
 assert.match(history,/aria-live="polite"/);
 assert.match(history,/setVisibleYear\("all"\)/);
 assert.match(history,/setVisibleStatus\("all-statuses"\)/);
 assert.match(hours,/1000/);
 assert.doesNotMatch(hours,/type="number"|setContactHours|hoursForm/);
 assert.match(hours,/estimateReportedContactHours/);
 assert.match(hours,/report.subtotalHours/);
 assert.match(hours,/report.norwayApproxHours/);
 const calendar=read("app/[locale]/nre/sections.tsx");
 assert.match(calendar,/export function NreAdvocacy/);
 assert.match(calendar,/https:\/\/www\.echr\.coe\.int\/fr\/european-convention-on-human-rights/);
 assert.match(calendar,/styles\.advocacySteps/);
 assert.match(calendar,/styles\.testimonyDetails/);

 assert.match(calendar,/nreMonthCalendar/);
 assert.match(calendar,/data-testid="nre-month-calendar"/);
 assert.match(calendar,/calendarDetailLink/);
 assert.match(calendar,/data-testid="nre-year-overview"/);
 assert.match(calendar,/data-month-status/);
 assert.doesNotMatch(calendar,/year >= 2022 \? "🇩🇪"/);
 assert.match(calendar,/id=\{\`nre-/);
 assert.match(hours,/elapsedSeparationSeconds/);
 assert.match(read("app/[locale]/nre/sections.tsx"),/legifrance\.gouv\.fr/);
});

test("unverified days are never presented as a verified total or inferred hours",()=>{
 for(const locale of ["fr","en","de","no"]){
  const content=read("messages/nre/"+locale+".json");
  assert.doesNotMatch(content,/61\s*(?:days|jours|Tage|dagene)|1[., ]?464/i);
  const c=JSON.parse(content).nrePage;
  for(const name of ["jumpHours","jumpTimeline","jumpTable"])assert.ok(c.hero[name]?.length>5);
  for(const name of ["contactEstimateHint","netHint","methodology","live","scope","source"])
    assert.ok(c.hours[name]?.length>4);
  assert.ok(c.exceptions.genericDetail.length>20);
 }
 for(const locale of ["fr","en"]){
  const html=read("public/nre-"+locale+".html");
  assert.doesNotMatch(html,/id="stat-days-eleonore">61</);
  assert.match(html,/id="stat-days-eleonore">—</);
 }
 const hours=read("app/[locale]/nre/NreLiveHours.tsx");
 assert.match(hours,/styles\.hoursPrimary/);
 assert.match(hours,/estimateReportedContactHours/);
 assert.match(hours,/styles\.methodology/);
 const timeline=read("app/[locale]/nre/sections.tsx");
 assert.match(timeline,/styles\.weekendCard/);
 assert.doesNotMatch(timeline,/row\.statusDetail/);
});
