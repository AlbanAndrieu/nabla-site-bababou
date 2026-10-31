/**
 * Pure calendar model for the NRE editorial inventory.
 *
 * Status "nre" is an assertion from the retained legacy HTML, NOT a
 * judicial finding. Later weekends are deliberately classified as "review":
 * the possible 2026 German suspension has not been verified from its order.
 * Never generate new NRE allegations from a calendar recurrence alone.
 */
export const NRE_REPORTED_ORDER = Object.freeze({
  effectiveFrom: "2017-03-31",
  monthlyWeekendHours: 10,
  schedule: "first-saturday-sunday",
  source: "owner-reported Oslo decision 2017-03-31; check operative wording",
});
export const NRE_REPORTED_SUSPENSION = Object.freeze({
  from: "2026-02-26",
  through: "2027-02-25",
  verified: false,
  source: "owner-reported German proceedings; operative decision not verified",
});
export const NRE_SEPARATION_REFERENCE = "2015-06-06T00:00:00.000Z";

function dateId(y, m, d) {
  return [y, String(m).padStart(2, "0"), String(d).padStart(2, "0")].join("-");
}
function utcDate(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
function parisDateString(now) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const find = (type) => parts.find(p => p.type === type)?.value;
  return [find("year"), find("month"), find("day")].join("-");
}
/** The first complete Saturday/Sunday pair of a month. */
export function firstWeekend(year, month) {
  if (!Number.isInteger(year) || year < 2000 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("Invalid year or month");
  }
  const first = utcDate(year, month, 1).getUTCDay();
  const startDay = 1 + ((6 - first + 7) % 7);
  return { year, month, startDay, endDay: startDay + 1,
    startDate: dateId(year,month,startDay), endDate: dateId(year,month,startDay+1) };
}
/** Generate only dates that have ENDED as of Europe/Paris's current day. */
export function completeNreInventory(legacy, now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new TypeError("Invalid clock");
  const cutoff = parisDateString(now);
  const rows = legacy.map(row => {
    if (row.year === 2017 && row.month === 3) return {
      ...row, status: "beforeOrder", statusDetail: "Listed before the cited 31 March 2017 decision; requires review",
    };
    return row;
  });
  const seen = new Set(rows.map(r=>dateId(r.year,r.month,1)));
  const latest = utcDate(Number(cutoff.slice(0,4)),Number(cutoff.slice(5,7)),1);
  for(let y=2017;y<=latest.getUTCFullYear();y++){
    for(let m=1;m<=12;m++){
      if(y<2026 || y===2026 && m<3) continue;
      const first=firstWeekend(y,m);
      if(first.endDate>cutoff) continue;
      const key=dateId(y,m,1);
      if(seen.has(key)) continue;
      rows.push({
        year:y,month:m,startDay:first.startDay,endDay:first.endDay,
        status:"review",statusDetail:"Unverified: rights and contact status require judicial and factual evidence",
      });
      seen.add(key);
    }
  }
  return rows.sort((a,b)=>a.year-b.year || a.month-b.month);
}
export function nreInventoryStats(rows) {
  const count = (status) => rows.filter(r=>r.status===status).length;
  const recordedMissed = count("nre");
  // Nominal 10h per recorded NRE weekend, not verified contact hours or damages.
  return { total:rows.length, recordedMissed, partialOrHonored:count("exception"),
    unverified:count("review"), beforeOrder:count("beforeOrder"),
    theoreticalScheduledHours: recordedMissed*NRE_REPORTED_ORDER.monthlyWeekendHours };
}
/** A realtime SEPARATION clock, *not* an NRE/legal entitlement calculation.
 * A date-only reference is approximate to within one day. No actual contact
 * duration can be inferred from '61 days' or the six exception entries.
 */
export function elapsedSeparationSeconds(now = Date.now(), verifiedContactHours = null) {
  const elapsed = Math.max(0, Math.floor((now-Date.parse(NRE_SEPARATION_REFERENCE))/1000));
  if(verifiedContactHours===null || verifiedContactHours===undefined || verifiedContactHours==="")
    return { elapsed, net:null };
  const actual = Number(verifiedContactHours);
  if(!Number.isFinite(actual) || actual<0 || actual*3600>elapsed)
    return { elapsed, net:null };
  return { elapsed, net:Math.max(0,elapsed-Math.floor(actual*3600)) };
}
