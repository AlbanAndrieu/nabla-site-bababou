import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import type { AppLocale } from "@/i18n/routing";
import type { NreRow } from "@/lib/nreLegacyData";
import { nreInventoryStats } from "@/lib/nreVisitLedger.mjs";
import styles from "./page.module.css";

export type NrePageCopy = {
  meta: { title: string; description: string };
  hero: { eyebrow: string; title: string; lead: string };
  stats: {
    heading: string;
    total: string;
    nre: string;
    exceptions: string;
    review: string;
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
  exceptions: { heading: string; lead: string; genericDetail: string };
  hours: { heading: string; gross: string; net: string; actual: string; actualHint: string; nominal: string; scope: string; source: string; unknown: string; review: string; refresh: string; suspension: string; beforeOrder: string };
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

function displayStatus(row: NreRow, copy: NrePageCopy, locale: AppLocale) {
  if (row.status === "nre") return copy.table.nre;
  if (row.status === "review") return copy.table.review;
  if (row.status === "beforeOrder") return copy.table.beforeOrder;
  if (locale === "fr" || locale === "en") return row.statusDetail;
  return copy.table.exception;
}

export function NreHero({ copy }: CopyProps) {
  return (
    <header className={styles.hero} aria-labelledby="nre-heading">
      <Badge variant="info">{copy.hero.eyebrow}</Badge>
      <h1 id="nre-heading">{copy.hero.title}</h1>
      <p>{copy.hero.lead}</p>
    </header>
  );
}

export function NreStats({ copy, rows }: DataProps) {
  const {total,recordedMissed,partialOrHonored,unverified,beforeOrder}=nreInventoryStats(rows);
  const stats = [
    [total, copy.stats.total],
    [recordedMissed, copy.stats.nre],
    [partialOrHonored, copy.stats.exceptions],
    [unverified+beforeOrder, copy.stats.review],
  ] as const;
  return (
    <section className={styles.section} aria-labelledby="nre-stats-heading">
      <h2 id="nre-stats-heading">{copy.stats.heading}</h2>
      <div className={styles.stats}>
        {stats.map(([value,label]) => (
          <Card key={label} elevated className={styles.statCard}>
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
          <p>
            {copy.reference.prefix}{" "}
            <a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006418025" target="_blank" rel="noopener noreferrer">{copy.reference.article}</a>. {copy.reference.filed} {copy.reference.judgment}
          </p>
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
        {[...byYear.entries()].map(([year, yearRows]) => (
          <article key={year} className={styles.yearBlock}>
            <h3>
              {year}{" "}
              <span aria-label={year >= 2022 ? copy.timeline.germany : copy.timeline.norway}>
                {year >= 2022 ? "🇩🇪" : "🇳🇴"}
              </span>
            </h3>
            <details className={styles.yearDetails} open={year === rows.at(-1)?.year}>
              <summary>{yearRows.length} {copy.table.weekend} · {yearRows.filter(row=>row.status==="nre").length} {copy.table.nre}</summary>
              <div className={styles.yearItems}>
              {yearRows.map((row) => (
                <span
                  key={`${row.year}-${row.month}`}
                  className={row.status === "exception" ? styles.exceptionChip : row.status === "nre" ? styles.nreChip : styles.reviewChip}
                  title={displayStatus(row, copy, locale)}
                >
                  {monthYear(row, locale)} {row.startDay}–{row.endDay}{" "}
                  {row.status === "exception" ? "✓" : row.status === "nre" ? "✗" : "?"}
                </span>
              ))}
              </div>
            </details>
          </article>
        ))}
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
                  {displayStatus(row, copy, locale)}
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
  return (
    <section className={styles.section} aria-labelledby="exceptions-heading">
      <h2 id="exceptions-heading">{copy.exceptions.heading}</h2>
      <p>{copy.exceptions.lead}</p>
      <ul className={styles.exceptionList}>
        {exceptions.map((row) => (
          <li key={`${row.year}-${row.month}`}>
            <strong>{monthYear(row, locale)} ({row.startDay}–{row.endDay})</strong>
            {" — "}
            {locale === "fr" || locale === "en" ? row.statusDetail : copy.exceptions.genericDetail}
          </li>
        ))}
      </ul>
    </section>
  );
}
