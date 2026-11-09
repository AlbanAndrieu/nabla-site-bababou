import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import type { AppLocale } from "@/i18n/routing";
import type { NreRow } from "@/lib/nreLegacyData";
import { nreInventoryStats, nreMonthCalendar } from "@/lib/nreVisitLedger.mjs";
import styles from "./page.module.css";

export type NrePageCopy = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; navigation: string; jumpHours: string; jumpRegister: string; jumpTimeline: string; jumpTable: string };
  advocacy: {
    eyebrow: string;
    heading: string;
    lead: string;
    emphasis: string;
    countriesLabel: string;
    countries: string;
    stepsLabel: string;
    requestTitle: string;
    requestBody: string;
    complaintsTitle: string;
    complaintsBody: string;
    consequenceTitle: string;
    consequenceBody: string;
    opinion: string;
    evidenceNotice: string;
    rightsIntro: string;
    rightsLink: string;
    jumpReference: string;
    jumpTimeline: string;
  };
  access: {
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    heading: string;
    intro: string;
    pending: string;
    navigation: string;
    contact: string;
    backToRegister: string;
    processHeading: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    step4Title: string;
    step4Body: string;
    catalogHeading: string;
    catalogIntro: string;
    france: string;
    norway: string;
    germany: string;
    contactRequests: string;
    entryDetails: string;
    notYetLinked: string;
    reviewedRef: string;
    reviewedHeading: string;
    noApprovedProofs: string;
    requestOnly: string;
    securityHeading: string;
    securityBody: string;
    existingPublicPdf: string;
    noAutomaticApproval: string;
    overviewHeading: string;
    overviewIntro: string;
    overviewEntries: string;
    overviewPending: string;
    overviewProofs: string;
    overviewContact: string;
    sitewideHeading: string;
    sitewideIntro: string;
    sitewideReference: string;
    sitewideInstructions: string;
    sitewideWithoutReference: string;
    sitewidePublicNotice: string;
  };
  register: {
    heading: string;
    intro: string;
    privateNotice: string;
    france: string;
    norway: string;
    germany: string;
    contactRequests: string;
    complaintReported: string;
    requestsReported: string;
    pendingProof: string;
    reviewedProof: string;
    requestOnly: string;
    requestHeading: string;
    requestInstructions: string;
    requestLink: string;
    openRecord: string;
    accessGuide: string;
    disclaimer: string;
  };
  stats: {
    heading: string;
    total: string;
    nre: string;
    exceptions: string;
  };
  reference: {
    heading: string;
    prefix: string;
    article: string;
    filed: string;
    judgment: string;
    document: string;
  };
  note: { heading: string; expand: string; p1: string; p2: string; p3: string };
  timeline: { heading: string; lead: string; norway: string; germany: string; viewDetails: string; empty: string; filters: string; datesShort: string; missedShort: string; visitsShort: string; reviewShort: string };
  location: { heading: string; body: string };
  table: {
    heading: string;
    lead: string;
    month: string;
    weekend: string;
    status: string;
    nre: string;
    exception: string;
    review: string;
    beforeOrder: string;
    filterYear: string;
    filterAll: string; filterStatus: string; filterAllStatuses: string; resultsCount: string; resetFilters: string;
  };
  exceptions: { heading: string; lead: string; genericDetail: string; extendedStay: string; otherWeekend: string };
  hours: { heading: string; intro: string; live: string; gross: string; contactEstimate: string; contactEstimateHint: string; countriesLabel: string; franceLabel: string; germanyLabel: string; norwayLabel: string; net: string; netHint: string; methodology: string; scope: string; source: string; refresh: string; suspension: string; beforeOrder: string };
};

type CopyProps = { copy: NrePageCopy };
type DataProps = CopyProps & { rows: NreRow[] };
type LocalizedDataProps = DataProps & { locale: AppLocale };

const LOCALE_CODES: Record<AppLocale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
  no: "nb-NO",
};

function monthYear(row: NreRow, locale: AppLocale) {
  return new Intl.DateTimeFormat(LOCALE_CODES[locale], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(row.year, row.month - 1, 1)));
}

function weekend(row: NreRow, locale: AppLocale) {
  const month = new Intl.DateTimeFormat(LOCALE_CODES[locale], {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(row.year, row.month - 1, 1)));
  return `${row.startDay}–${row.endDay} ${month} ${row.year}`;
}

function displayStatus(row: NreRow, copy: NrePageCopy) {
  if (row.status === "nre") return copy.table.nre;
  if (row.status === "review") return copy.table.review;
  if (row.status === "beforeOrder") return copy.table.beforeOrder;
  return copy.table.exception;
}

export function NreHero({ copy }: CopyProps) {
  return (
    <header className={styles.hero} aria-labelledby="nre-heading">
      <Badge variant="info">{copy.hero.eyebrow}</Badge>
      <h1 id="nre-heading">{copy.hero.title}</h1>
      <nav className={styles.quickNav} aria-label={copy.hero.navigation}>
        <a href="#nre-register">{copy.hero.jumpRegister}</a>
        <a href="#nre-hours-heading">{copy.hero.jumpHours}</a>
        <a href="#timeline-heading">{copy.hero.jumpTimeline}</a>
        <a href="#table-heading">{copy.hero.jumpTable}</a>
      </nav>
    </header>
  );
}

export function NreAdvocacy({ copy }: CopyProps) {
  const effortSteps = [
    { number: "01", title: copy.advocacy.requestTitle, body: copy.advocacy.requestBody },
    { number: "02", title: copy.advocacy.complaintsTitle, body: copy.advocacy.complaintsBody },
    { number: "03", title: copy.advocacy.consequenceTitle, body: copy.advocacy.consequenceBody },
  ];
  return (
    <section className={styles.advocacy} aria-labelledby="nre-advocacy-heading">
      <div className={styles.advocacyHeader}>
        <div className={styles.advocacyCopy}>
          <p className={styles.advocacyEyebrow}>{copy.advocacy.eyebrow}</p>
          <h2 id="nre-advocacy-heading">{copy.advocacy.heading}</h2>
          <p className={styles.advocacyLead}>{copy.advocacy.lead}</p>
          <p className={styles.advocacyEmphasis}>{copy.advocacy.emphasis}</p>
        </div>
        <div className={styles.advocacyCountries}>
          <strong>{copy.advocacy.countriesLabel}</strong>
          <span>{copy.advocacy.countries}</span>
          <div className={styles.advocacyCountryFlags} aria-hidden="true">
            <span>🇫🇷</span><span>🇳🇴</span><span>🇩🇪</span>
          </div>
        </div>
      </div>
      <h3 className={styles.advocacyStepsHeading}>{copy.advocacy.stepsLabel}</h3>
      <ol className={styles.advocacySteps}>
        {effortSteps.map((step) => (
          <li key={step.number}>
            <span className={styles.advocacyStepNumber} aria-hidden="true">{step.number}</span>
            <div>
              <h4>{step.title}</h4>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.advocacyContext}>
        <p>{copy.advocacy.opinion}</p>
        <p className={styles.advocacyRights}>
          {copy.advocacy.rightsIntro}{" "}
          <a href="https://www.echr.coe.int/fr/european-convention-on-human-rights"
            target="_blank" rel="noopener noreferrer">{copy.advocacy.rightsLink}</a>.
        </p>
        <p className={styles.advocacyEvidence}>{copy.advocacy.evidenceNotice}</p>
        <nav className={styles.advocacyLinks} aria-label={copy.advocacy.stepsLabel}>
          <a href="#reference-heading">{copy.advocacy.jumpReference}</a>
          <a href="#timeline-heading">{copy.advocacy.jumpTimeline}</a>
        </nav>
      </div>
    </section>
  );
}

export function NreStats({ copy, rows }: DataProps) {
  const {total,recordedMissed,partialOrHonored}=nreInventoryStats(rows);
  const stats = [
    [total, copy.stats.total, styles.statTotal],
    [recordedMissed, copy.stats.nre, styles.statMissed],
    [partialOrHonored, copy.stats.exceptions, styles.statContact],
  ] as const;
  return (
    <section className={styles.section} aria-labelledby="nre-stats-heading">
      <h2 id="nre-stats-heading">{copy.stats.heading}</h2>
      <div className={styles.stats}>
        {stats.map(([value,label,tone]) => (
          <Card key={label} elevated className={`${styles.statCard} ${tone}`}>
            <CardBody>
              <strong className={styles.statValue}>{value}</strong>
              <span>{label}</span>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function NreReference({ copy }: CopyProps) {
  return (
    <section className={styles.section} aria-labelledby="reference-heading">
      <Card elevated borderless>
        <CardBody>
          <h2 id="reference-heading">{copy.reference.heading}</h2>
          <p>{copy.reference.prefix}</p>
          <p>
            {copy.reference.judgment}{" "}
            <a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006418025" target="_blank" rel="noopener noreferrer">{copy.reference.article}</a>.
          </p>
          <p>{copy.reference.filed}</p>
          <p>
            <a href="/assets/plainte-procureur-tgi-valence-04-08-2023-1.pdf">{copy.reference.document}</a>
          </p>
        </CardBody>
      </Card>
    </section>
  );
}

export function NreNote({ copy }: CopyProps) {
  return (
    <section className={styles.section} aria-labelledby="nre-note-heading">
      <h2 id="nre-note-heading">{copy.note.heading}</h2>
      <details className={styles.testimonyDetails}>
        <summary>{copy.note.expand}</summary>
        <div className={styles.testimonyBody}>
          <p>{copy.note.p1}</p>
          <p>{copy.note.p2}</p>
          <p>{copy.note.p3}</p>
        </div>
      </details>
    </section>
  );
}

/** A complete month calendar; each two-day weekend is also available as readable text. */
function MonthCalendar({ row, weekdays }: { row: NreRow; weekdays: string[] }) {
  const days = nreMonthCalendar(row);
  return (
    <div data-testid="nre-month-calendar" className={styles.calendarStrip} aria-hidden="true">
      <div className={styles.calendarWeekdays}>
        {weekdays.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <div className={styles.calendarDays}>
        {days.map((day, index) => {
          const weekend = day !== null && (day === row.startDay || day === row.endDay);
          return (
            <span
              key={index}
              data-calendar-day="true"
              data-weekend={weekend ? "true" : undefined}
              className={`${styles.calendarDay} ${weekend ? styles.calendarWeekend : ""}`}
            >
              {day ?? ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function NreTimeline({ copy, rows, locale }: LocalizedDataProps) {
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(LOCALE_CODES[locale], {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, index + 1))),
  );
  const byYear = Map.groupBy(rows, (row) => row.year);

  return (
    <section className={styles.section} aria-labelledby="timeline-heading">
      <h2 id="timeline-heading">{copy.timeline.heading}</h2>
      <p>{copy.timeline.lead}</p>
      <div className={styles.legend} aria-label={copy.timeline.lead}>
        <span className={styles.nreChip}>✗ {copy.table.nre}</span>
        <span className={styles.exceptionChip}>✓ {copy.table.exception}</span>
        <span className={styles.reviewChip}>? {copy.table.review}</span>
      </div>
      {rows.length === 0 ? <p className={styles.calendarEmpty}>{copy.timeline.empty}</p> : null}
      <div className={styles.timeline}>
        {[...byYear.entries()].reverse().map(([year, yearRows]) => {
          const missed = yearRows.filter((row) => row.status === "nre").length;
          const visited = yearRows.filter((row) => row.status === "exception").length;
          const review = yearRows.filter((row) => row.status === "review" || row.status === "beforeOrder").length;
          return (
            <article key={year} className={styles.yearBlock}>
              <h3 className={styles.yearHeading}>
                <span className={styles.yearNumber}>{year}</span>
              </h3>
              <details className={styles.yearDetails} open={year === rows.at(-1)?.year}>
                <summary>
                  <span>{yearRows.length} {copy.timeline.datesShort}</span>
                  <span className={styles.yearSummaryCount}>
                    {missed ? `${missed} ${copy.timeline.missedShort}` : ""}
                    {visited ? `${missed ? " · " : ""}${visited} ${copy.timeline.visitsShort}` : ""}
                    {review ? `${missed || visited ? " · " : ""}${review} ${copy.timeline.reviewShort}` : ""}
                  </span>
                  <span className={styles.yearOverview} data-testid="nre-year-overview" aria-hidden="true">
                    {Array.from({ length: 12 }, (_, month) => {
                      const row = yearRows.find((entry) => entry.month === month + 1);
                      const tone = !row ? styles.yearMonthEmpty :
                        row.status === "nre" ? styles.yearMonthNre :
                        row.status === "exception" ? styles.yearMonthContact : styles.yearMonthReview;
                      return (
                        <span key={month} data-month-status={row?.status ?? "none"} className={`${styles.yearMonth} ${tone}`}
                          title={row ? `${monthYear(row, locale)} — ${displayStatus(row, copy)}` : undefined}
                        />
                      );
                    })}
                  </span>
                </summary>
                <ol className={styles.yearItems}>
                  {yearRows.map((row) => (
                    <li
                      key={`${row.year}-${row.month}`}
                      className={`${styles.weekendCard} ${
                        row.status === "exception" ? styles.weekendContact :
                        row.status === "nre" ? styles.weekendMissed : styles.weekendReview
                      }`}
                    >
                      <span className={styles.weekendMonth}>{monthYear(row, locale)}</span>
                      <MonthCalendar row={row} weekdays={weekdays} />
                      <strong className={styles.weekendDates}>{row.startDay}–{row.endDay}</strong>
                      <span className={styles.weekendStatus}>
                        <span aria-hidden="true">{row.status === "exception" ? "✓" : row.status === "nre" ? "×" : "?"}</span>
                        {displayStatus(row, copy)}
                      </span>
                      <a
                        className={styles.calendarDetailLink}
                        href={`#nre-${row.year}-${String(row.month).padStart(2, "0")}`}
                      >
                        {copy.timeline.viewDetails}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function NreLocation({ copy }: CopyProps) {
  return (
    <section className={styles.location} aria-labelledby="location-heading">
      <h2 id="location-heading" className={styles.visuallyHidden}>{copy.location.heading}</h2>
      <strong>{copy.location.heading}:</strong> {copy.location.body}
    </section>
  );
}

export function NreTable({ copy, rows, locale }: LocalizedDataProps) {
  return (
    <section className={styles.section} aria-labelledby="table-heading">
      <h2 id="table-heading">{copy.table.heading}</h2>
      <p>{copy.table.lead}</p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{copy.table.month}</th>
              <th scope="col">{copy.table.weekend}</th>
              <th scope="col">{copy.table.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr id={`nre-${row.year}-${String(row.month).padStart(2, "0")}`} key={`${row.year}-${row.month}`} data-nre={row.status === "nre" ? "true" : undefined} data-exception={row.status === "exception" ? "true" : undefined} data-review={row.status === "review" || row.status === "beforeOrder" ? "true" : undefined}>
                <td>{monthYear(row, locale)}</td>
                <td>{weekend(row, locale)}</td>
                <td className={row.status === "exception" ? styles.exceptionStatus : row.status === "nre" ? styles.nreStatus : styles.reviewStatus}>
                  {displayStatus(row, copy)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function NreExceptions({ copy, rows, locale }: LocalizedDataProps) {
  const exceptions = rows.filter((row) => row.status === "exception");
  const extended = new Set(["2020-1", "2021-8", "2021-10", "2022-1"]);
  return (
    <section className={styles.section} aria-labelledby="exceptions-heading">
      <h2 id="exceptions-heading">{copy.exceptions.heading}</h2>
      <p>{copy.exceptions.lead}</p>
      <ul className={styles.exceptionList}>
        {exceptions.map((row) => (
          <li key={`${row.year}-${row.month}`}>
            <strong>{monthYear(row, locale)} ({row.startDay}–{row.endDay})</strong>
            {" — "}
            {extended.has(`${row.year}-${row.month}`)
              ? copy.exceptions.extendedStay
              : row.year === 2022 && row.month === 11
                ? copy.exceptions.otherWeekend
                : copy.exceptions.genericDetail}
          </li>
        ))}
      </ul>
    </section>
  );
}
