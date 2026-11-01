import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import type { AppLocale } from "@/i18n/routing";
import type { NreRow } from "@/lib/nreLegacyData";
import { nreInventoryStats } from "@/lib/nreVisitLedger.mjs";
import styles from "./page.module.css";

export type NrePageCopy = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; navigation: string; jumpHours: string; jumpTimeline: string; jumpTable: string };
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
  note: { heading: string; p1: string; p2: string; p3: string };
  timeline: { heading: string; lead: string; norway: string; germany: string };
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
    filterAll: string;
  };
  exceptions: { heading: string; lead: string; genericDetail: string; extendedStay: string; otherWeekend: string };
  hours: { heading: string; intro: string; live: string; gross: string; contactEstimate: string; contactEstimateHint: string; net: string; netHint: string; methodology: string; scope: string; source: string; refresh: string; suspension: string; beforeOrder: string };
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
        <a href="#nre-hours-heading">{copy.hero.jumpHours}</a>
        <a href="#timeline-heading">{copy.hero.jumpTimeline}</a>
        <a href="#table-heading">{copy.hero.jumpTable}</a>
      </nav>
    </header>
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
    <section className={styles.section} aria-labelledby="note-heading">
      <Card elevated className={styles.noteCard}>
        <CardBody>
          <h2 id="note-heading">{copy.note.heading}</h2>
          <p>{copy.note.p1}</p>
          <p>{copy.note.p2}</p>
          <p>{copy.note.p3}</p>
        </CardBody>
      </Card>
    </section>
  );
}

export function NreTimeline({ copy, rows, locale }: LocalizedDataProps) {
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
      <div className={styles.timeline}>
        {[...byYear.entries()].reverse().map(([year, yearRows]) => {
          const missed = yearRows.filter((row) => row.status === "nre").length;
          const review = yearRows.filter((row) => row.status === "review" || row.status === "beforeOrder").length;
          return (
            <article key={year} className={styles.yearBlock}>
              <h3 className={styles.yearHeading}>
                <span className={styles.yearNumber}>{year}</span>
                <span className={styles.yearCountry} aria-label={year >= 2022 ? copy.timeline.germany : copy.timeline.norway}>
                  {year >= 2022 ? "🇩🇪" : "🇳🇴"}
                </span>
              </h3>
              <details className={styles.yearDetails} open={year === rows.at(-1)?.year}>
                <summary>
                  <span>{yearRows.length} {copy.table.weekend}</span>
                  <span className={styles.yearSummaryCount}>
                    {missed} {copy.table.nre}
                    {review ? ` · ${review} ${copy.table.review}` : ""}
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
                      <strong className={styles.weekendDates}>{row.startDay}–{row.endDay}</strong>
                      <span className={styles.weekendStatus}>
                        <span aria-hidden="true">{row.status === "exception" ? "✓" : row.status === "nre" ? "×" : "?"}</span>
                        {displayStatus(row, copy)}
                      </span>
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
              <tr key={`${row.year}-${row.month}`} data-nre={row.status === "nre" ? "true" : undefined} data-exception={row.status === "exception" ? "true" : undefined} data-review={row.status === "review" || row.status === "beforeOrder" ? "true" : undefined}>
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
