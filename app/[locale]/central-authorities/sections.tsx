import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import styles from "./page.module.css";

type TimelineItem = {
  date: string;
  body: string;
  source?: string;
};

type ContactCopy = {
  name: string;
  authority: string;
  details: string;
  people?: string;
  extra?: string;
};

export type CentralAuthoritiesCopy = {
  meta: { title: string; description: string };
  hero: { title: string; lead: string };
  summary: { title: string; body: string; citations: string };
  timeline: {
    title: string;
    warningTitle: string;
    warningBody: string;
    group2015: string;
    september2015: TimelineItem;
    october2015: TimelineItem;
    october192015: TimelineItem;
    october222015: TimelineItem;
    december2015: TimelineItem;
    january2016: TimelineItem;
    year2016: TimelineItem;
    related: string;
    group2022: string;
    year2022: TimelineItem;
    since2022: TimelineItem;
    year2024: TimelineItem;
    february2025: TimelineItem;
    today2026: TimelineItem;
  };
  legal: {
    title: string;
    intro: string;
    article3Title: string;
    article3Intro: string;
    clauseA: string;
    clauseB: string;
    clauseDetail: string;
    source: string;
    interpretationTitle: string;
    wrongfulTitle: string;
    wrongfulBody: string;
    custodyTitle: string;
    custodyBody: string;
    habitualTitle: string;
    habitualBody: string;
    returnTitle: string;
    returnBody: string;
    practicalTitle: string;
    practicalBody: string;
    legalBasis: string;
  };
  documents: {
    title: string;
    intro: string;
    emailTitle: string;
    emailBody: string;
    otherTitle: string;
    otherBody: string;
    osloTitle: string;
    osloBody: string;
    open: string;
  };
  contacts: {
    title: string;
    intro: string;
    france: ContactCopy;
    franceMinistry: string;
    norway: ContactCopy;
    norwayCity: string;
    norwayEmbassy: string;
    germany: ContactCopy;
  };
};

type CopyProps = { copy: CentralAuthoritiesCopy };

const primaryTimelineKeys = [
  "september2015",
  "october2015",
  "october192015",
  "october222015",
  "december2015",
  "january2016",
  "year2016",
] as const;
const recentTimelineKeys = [
  "year2022",
  "since2022",
  "year2024",
  "february2025",
  "today2026",
] as const;

function TimelineItems({ items }: { items: TimelineItem[] }) {
  return (
    <div className={styles.timelineList}>
      {items.map((item) => (
        <article className={styles.timelineItem} key={`${item.date}-${item.body}`}>
          <h4>{item.date}</h4>
          <p>{item.body}</p>
          {item.source ? <p className={styles.source}>{item.source}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function AuthoritiesHero({ copy }: CopyProps) {
  return (
    <header className={styles.hero} aria-labelledby="ca-heading">
      <div className={styles.badges} aria-label="Hague Convention scope">
        <Badge variant="info">Hague Convention 1980</Badge>
        <Badge>France</Badge>
        <Badge>Norway</Badge>
        <Badge>Germany</Badge>
      </div>
      <h1 id="ca-heading">{copy.hero.title}</h1>
      <p className={styles.lead}>{copy.hero.lead}</p>
    </header>
  );
}

export function AuthoritiesSummary({ copy }: CopyProps) {
  return (
    <section className={styles.section} aria-labelledby="summary-heading">
      <h2 id="summary-heading">{copy.summary.title}</h2>
      <Card elevated borderless>
        <CardBody>
          <p>{copy.summary.body}</p>
          <p className={styles.source}>{copy.summary.citations}</p>
          <div className={styles.inlineLinks}>
            <ActionLink href="/ca/" variant="outline" size="compact">ca/</ActionLink>
            <ActionLink href="/abduction-norway.html" variant="outline" size="compact">Norway proceedings</ActionLink>
            <ActionLink href="#documents-heading" variant="outline" size="compact">Documents</ActionLink>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}

export function AuthoritiesTimeline({ copy }: CopyProps) {
  const firstItems = primaryTimelineKeys.map((key) => copy.timeline[key]);
  const recentItems = recentTimelineKeys.map((key) => copy.timeline[key]);

  return (
    <section className={styles.section} aria-labelledby="timeline-heading">
      <h2 id="timeline-heading">{copy.timeline.title}</h2>
      <div className={styles.warning} role="note">
        <strong>{copy.timeline.warningTitle}</strong> {copy.timeline.warningBody}
      </div>
      <h3>{copy.timeline.group2015}</h3>
      <TimelineItems items={firstItems} />
      <p className={styles.related}>
        {copy.timeline.related}{" "}
        <a href="/ca/demande-explications-autorites-competentes-fr.html">FR</a>{" · "}
        <a href="/ca/demande-explications-autorites-competentes-en.html">EN</a>{" · "}
        <a href="/abduction-germany.html">Germany</a>
      </p>
      <h3>{copy.timeline.group2022}</h3>
      <TimelineItems items={recentItems} />
    </section>
  );
}

export function LegalGrounds({ copy }: CopyProps) {
  const interpretations = [
    [copy.legal.wrongfulTitle, copy.legal.wrongfulBody],
    [copy.legal.custodyTitle, copy.legal.custodyBody],
    [copy.legal.habitualTitle, copy.legal.habitualBody],
    [copy.legal.returnTitle, copy.legal.returnBody],
    [copy.legal.practicalTitle, copy.legal.practicalBody],
  ] as const;

  return (
    <section className={styles.section} aria-labelledby="legal-heading">
      <h2 id="legal-heading">{copy.legal.title}</h2>
      <p>{copy.legal.intro}</p>
      <h3 id="article3-heading">{copy.legal.article3Title}</h3>
      <p>{copy.legal.article3Intro}</p>
      <blockquote className={styles.legalQuote} cite="https://www.hcch.net/en/instruments/conventions/full-text/?cid=24">
        <p><strong>a)</strong> {copy.legal.clauseA}</p>
        <p><strong>b)</strong> {copy.legal.clauseB}</p>
        <p>{copy.legal.clauseDetail}</p>
      </blockquote>
      <p className={styles.source}>
        {copy.legal.source}{" "}
        <a href="https://www.hcch.net/en/instruments/conventions/full-text/?cid=24" target="_blank" rel="noopener noreferrer">HCCH</a>
      </p>
      <h3 id="interpretation-heading">{copy.legal.interpretationTitle}</h3>
      <ul className={styles.interpretationList}>
        {interpretations.map(([title, body]) => (
          <li key={title}><strong>{title}</strong> {body}</li>
        ))}
      </ul>
      <p className={styles.source}>
        {copy.legal.legalBasis}{" "}
        <a href="https://www.hcch.net/en/instruments/conventions/full-text/?cid=24" target="_blank" rel="noopener noreferrer">HCCH</a>{" · "}
        <a href="/abduction-norway.html">Norway</a>{" · "}
        <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F1191" target="_blank" rel="noopener noreferrer">France</a>{" · "}
        <a href="https://www.regjeringen.no/en/sub/child-abduction/id468120/" target="_blank" rel="noopener noreferrer">Norway authority</a>
      </p>
    </section>
  );
}

export function AuthoritiesDocuments({ copy }: CopyProps) {
  const documents = [
    [copy.documents.emailTitle, copy.documents.emailBody],
    [copy.documents.otherTitle, copy.documents.otherBody],
    [copy.documents.osloTitle, copy.documents.osloBody],
  ] as const;

  return (
    <section className={styles.section} aria-labelledby="documents-heading">
      <h2 id="documents-heading">{copy.documents.title}</h2>
      <p>{copy.documents.intro}</p>
      <Card elevated>
        <CardBody>
          <ul className={styles.documentList}>
            {documents.map(([title, body]) => (
              <li key={title}><strong>{title}</strong> — {body}</li>
            ))}
          </ul>
          <ActionLink href="/ca/" variant="outline">{copy.documents.open}</ActionLink>
        </CardBody>
      </Card>
    </section>
  );
}

export function AuthoritiesContacts({ copy }: CopyProps) {
  const contacts = [copy.contacts.france, copy.contacts.norway, copy.contacts.germany];

  return (
    <section className={styles.section} aria-labelledby="contacts-heading">
      <h2 id="contacts-heading">{copy.contacts.title}</h2>
      <p>{copy.contacts.intro}</p>
      <div className={styles.contactGrid}>
        {contacts.map((contact) => (
          <Card elevated key={contact.name} className={styles.contactCard}>
            <CardBody>
              <h3>{contact.name}</h3>
              <p><strong>{contact.authority}</strong></p>
              <p className={styles.preLine}>{contact.details}</p>
              {contact.people ? <p>{contact.people}</p> : null}
              {contact.extra ? <p>{contact.extra}</p> : null}
            </CardBody>
          </Card>
        ))}
      </div>
      <div className={styles.supportingContacts}>
        <p>{copy.contacts.franceMinistry}</p>
        <p>{copy.contacts.norwayCity}</p>
        <p>{copy.contacts.norwayEmbassy}</p>
      </div>
      <div className={styles.inlineLinks}>
        <ActionLink href="mailto:entraide-civile-internationale@justice.gouv.fr" variant="outline" size="compact">French Central Authority</ActionLink>
        <ActionLink href="https://www.regjeringen.no/en/sub/child-abduction/id468120/" variant="outline" size="compact">Norwegian Central Authority</ActionLink>
        <ActionLink href="https://www.bundesjustizamt.de/EN/Home/home_node.html" variant="outline" size="compact">German Central Authority</ActionLink>
      </div>
    </section>
  );
}
