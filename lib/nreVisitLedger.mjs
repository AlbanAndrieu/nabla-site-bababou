/**
 * Pure calendar model for the NRE editorial inventory.
 *
 * "nre" denotes owner-reported absence of contact, not a judicial finding
 * or proof that a visitation order was enforceable. On 2026-11-14 the owner
 * explicitly reported that all 2026 visit requests had been refused by the
 * mother, except the separately listed contacts. Classify only COMPLETED
 * 2026 weekends from this report. 2027 onwards remain "review"; the
 * unverified German contact suspension is a separate legal question.
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
/** Owner's specific 2026 testimony. Not an independent finding. */
export const NRE_REPORTED_2026_REFUSALS = Object.freeze({
  year: 2026,
  startMonth: 3,
  endMonth: 12,
  reportedAt: "2026-11-14",
  statement: "all 2026 visit requests refused by the mother except recorded exceptions",
  courtOrderVerified: false,
  judicialFinding: false,
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
    // Cached placeholders from earlier versions can be reclassified once
    // the month is complete. Explicit contact exceptions always win.
    if (row.year === NRE_REPORTED_2026_REFUSALS.year &&
        row.month >= NRE_REPORTED_2026_REFUSALS.startMonth &&
        row.month <= NRE_REPORTED_2026_REFUSALS.endMonth &&
        row.status === "review" &&
        firstWeekend(row.year, row.month).endDate < cutoff) {
      return { ...row, status: "nre",
        statusDetail: "Refusal according to the father's 2026 account; legal effect unverified" };
    }
    return row;
  });
  const seen = new Set(rows.map(r=>dateId(r.year,r.month,1)));
  const latest = utcDate(Number(cutoff.slice(0,4)),Number(cutoff.slice(5,7)),1);
  for(let y=2017;y<=latest.getUTCFullYear();y++){
    for(let m=1;m<=12;m++){
      if(y<2026 || y===2026 && m<3) continue;
      const first=firstWeekend(y,m);
      // The Sunday remains incomplete until Monday 00:00 in Europe/Paris.
      if(first.endDate>=cutoff) continue;
      const key=dateId(y,m,1);
      if(seen.has(key)) continue;
      const reportedRefusal = y === NRE_REPORTED_2026_REFUSALS.year &&
        m >= NRE_REPORTED_2026_REFUSALS.startMonth &&
        m <= NRE_REPORTED_2026_REFUSALS.endMonth;
      rows.push({
        year:y,month:m,startDay:first.startDay,endDay:first.endDay,
        status:reportedRefusal ? "nre" : "review",
        statusDetail:reportedRefusal
          ? "Refusal according to the father's 2026 account; legal effect unverified"
          : "Unverified: rights and contact status require judicial and factual evidence",
      });
      seen.add(key);
    }
  }
  return rows.sort((a,b)=>a.year-b.year || a.month-b.month);
}
/**
 * Owner-reported approximate periods, not a verified log of active contact.
 * Norway: around three brief one-hour meetings, without identifiable dates.
 * These meetings are not attributed to specific calendar weekends.
 * France: two one-week stays and one four-week stay (calendar co-presence).
 * Germany: a one-hour reunion and a later 24-hour weekend.
 */
export const NRE_REPORTED_CONTACT = Object.freeze({
  franceOneWeekStays: 2,
  franceFourWeekStays: 1,
  germanyReunionHours: 1,
  germanySubsequentWeekendHours: 24,
  norwegianBriefMeetingsApprox: 3,
  norwegianBriefContactHours: 1,
});

/** A seven-day Mon–Sun strip containing the archived Saturday/Sunday. */
export function nreWeekendStrip(row) {
  const { year, month, startDay, endDay } = row;
  const saturday = utcDate(year, month, startDay);
  const daysInMonth = utcDate(year, month + 1, 0).getUTCDate();
  if (!Number.isInteger(startDay) || saturday.getUTCMonth() !== month - 1 ||
      saturday.getUTCDay() !== 6 || endDay !== startDay + 1 ||
      endDay > daysInMonth) {
    throw new RangeError("Invalid archived weekend");
  }
  const monday = startDay - 5;
  return Array.from({ length: 7 }, (_, index) => {
    const day = monday + index;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

/** A full Monday-first month grid, with null cells outside the month.
 * The original weekend validation remains authoritative for archived rows.
 */
export function nreMonthCalendar(row) {
  nreWeekendStrip(row);
  const firstWeekday = utcDate(row.year, row.month, 1).getUTCDay();
  const leadingEmptyCells = (firstWeekday + 6) % 7;
  const daysInMonth = utcDate(row.year, row.month + 1, 0).getUTCDate();
  const cells = Math.ceil((leadingEmptyCells + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, index) => {
    const day = index - leadingEmptyCells + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

export function estimateReportedContactHours(rows) {
  if (!Array.isArray(rows)) throw new TypeError("Invalid weekend inventory");
  const franceVacationDays = (NRE_REPORTED_CONTACT.franceOneWeekStays +
    4 * NRE_REPORTED_CONTACT.franceFourWeekStays) * 7;
  const franceCalendarHours = franceVacationDays * 24;
  const germanyHours = NRE_REPORTED_CONTACT.germanyReunionHours +
    NRE_REPORTED_CONTACT.germanySubsequentWeekendHours;
  const norwayApproxHours = NRE_REPORTED_CONTACT.norwegianBriefMeetingsApprox *
    NRE_REPORTED_CONTACT.norwegianBriefContactHours;
  return {
    franceVacationDays,
    franceCalendarHours,
    germanyHours,
    norwayReportedMeetingsApprox: NRE_REPORTED_CONTACT.norwegianBriefMeetingsApprox,
    norwayApproxHours,
    norwayDatesUnverified: true,
    subtotalHours: franceCalendarHours + germanyHours + norwayApproxHours,
    measuredContactHours: null,
  };
}
export function nreInventoryStats(rows) {
  const count = (status) => rows.filter(r=>r.status===status).length;
  const recordedMissed = count("nre");
  // Nominal 10h per reported NRE weekend; not legally enforceable hours,
  // proven unlawful refusal, directly measured contact or damages.
  return { total:rows.length, recordedMissed, partialOrHonored:count("exception"),
    unverified:count("review"), beforeOrder:count("beforeOrder"),
    theoreticalScheduledHours: recordedMissed*NRE_REPORTED_ORDER.monthlyWeekendHours };
}
/** Descriptive proportion among owner-classified dates, including 2026, not a finding
 * of unlawful refusal or responsibility by a particular person.
 * Unverified and pre-order dates are deliberately excluded.
 */
export function reportedMissedVisitShare(rows) {
  if (!Array.isArray(rows)) throw new TypeError("Invalid weekend inventory");
  const { recordedMissed, partialOrHonored } = nreInventoryStats(rows);
  const classified = recordedMissed + partialOrHonored;
  return {
    recordedMissed,
    classified,
    percentage: classified === 0 ? null : Math.round(recordedMissed / classified * 1000) / 10,
  };
}
/** A realtime SEPARATION clock, *not* an NRE/legal entitlement calculation.
 * A date-only reference is approximate to within one day. No actual contact
 * duration can be inferred from the six exception entries.
 */
/** @param {number} [now] @param {number|string|null|undefined} [verifiedContactHours] */
export function elapsedSeparationSeconds(now = Date.now(), verifiedContactHours = null) {
  if (typeof now !== "number" || !Number.isFinite(now)) {
    throw new TypeError("Invalid clock");
  }
  const elapsed = Math.max(0, Math.floor((now - Date.parse(NRE_SEPARATION_REFERENCE)) / 1000));
  if (verifiedContactHours === null || verifiedContactHours === undefined || verifiedContactHours === "") {
    return { elapsed, net: null };
  }
  // HTML number inputs produce decimal strings. Reject coerced booleans,
  // whitespace, hexadecimal and scientific notation rather than inventing hours.
  if (typeof verifiedContactHours !== "number" &&
      (typeof verifiedContactHours !== "string" ||
       !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(verifiedContactHours))) {
    return { elapsed, net: null };
  }
  const actual = Number(verifiedContactHours);
  if (!Number.isFinite(actual) || actual < 0 || actual * 3600 > elapsed) {
    return { elapsed, net: null };
  }
  return { elapsed, net: Math.max(0, elapsed - Math.floor(actual * 3600)) };
}
