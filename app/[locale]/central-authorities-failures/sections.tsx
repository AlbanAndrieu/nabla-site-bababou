import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import styles from "./page.module.css";

type CountryCopy = {
  name: string;
  point1: string;
  point2: string;
  point3?: string;
  cta: string;
};

export type CentralAuthoritiesFailuresCopy = {
  meta: {
    title: string;
    description: string;
  };
  scope: {
    label: string;
    hague: string;
    france: string;
    norway: string;
    germany: string;
  };
  hero: {
    title: string;
    lead: string;
  };
  summary: {
    title: string;
    locatedTitle: string;
    locatedBody: string;
    norwayTitle: string;
    norwayBody: string;
    germanyTitle: string;
    germanyBody: string;
    delayTitle: string;
    delayBody: string;
  };
  countries: {
    title: string;
    france: CountryCopy;
    norway: CountryCopy;
    germany: CountryCopy;
  };
  timeline: {
    title: string;
    norway: string;
    refused: string;
    germany: string;
    noReturn: string;
    fullTimeline: string;
  };
  readMore: {
    title: string;
    centralAuthorities: string;
    norway: string;
    germany: string;
  };
};

type CopyProps = {
  copy: CentralAuthoritiesFailuresCopy;
};

const countryDefinitions = [
  {
    key: "france",
    icon: "fa-landmark",
    tone: styles.france,
    // Relative route keeps the active locale while avoiding the retained
    // legacy .html redirect (e.g. /de/... -> /de/central-authorities).
    href: "central-authorities",
  },
  {
    key: "norway",
    icon: "fa-gavel",
    tone: styles.norway,
    href: "/abduction-norway.html",
  },
  {
    key: "germany",
    icon: "fa-ban",
    tone: styles.germany,
    href: "/abduction-germany.html",
  },
] as const;

export function ArticleHero({ copy }: CopyProps) {
  return (
    <header className={styles.hero} aria-labelledby="headline">
      <div className={styles.badges} aria-label={copy.scope.label}>
        <Badge variant="info">{copy.scope.hague}</Badge>
        <Badge>{copy.scope.france}</Badge>
        <Badge>{copy.scope.norway}</Badge>
        <Badge>{copy.scope.germany}</Badge>
      </div>
      <h1 id="headline">{copy.hero.title}</h1>
      <p className={styles.lead}>{copy.hero.lead}</p>
    </header>
  );
}

export function FailureSummary({ copy }: CopyProps) {
  const items = [
    [copy.summary.locatedTitle, copy.summary.locatedBody],
    [copy.summary.norwayTitle, copy.summary.norwayBody],
    [copy.summary.germanyTitle, copy.summary.germanyBody],
    [copy.summary.delayTitle, copy.summary.delayBody],
  ] as const;

  return (
    <section className={styles.section} aria-labelledby="in-short-heading">
      <h2 id="in-short-heading">{copy.summary.title}</h2>
      <Card elevated borderless>
        <CardBody className={styles.summaryBody}>
          <ul>
            {items.map(([title, body]) => (
              <li key={title}>
                <strong>{title}</strong> {body}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </section>
  );
}

export function CountryFailures({ copy }: CopyProps) {
  return (
    <section
      className={styles.section}
      aria-labelledby="failures-by-country-heading"
    >
      <h2 id="failures-by-country-heading">{copy.countries.title}</h2>
      <div className={styles.countryGrid}>
        {countryDefinitions.map((definition) => {
          const country = copy.countries[definition.key];
          const points = [country.point1, country.point2, country.point3].filter(
            (point): point is string => Boolean(point),
          );

          return (
            <Card
              key={definition.key}
              elevated
              className={styles.countryCard}
            >
              <CardBody className={styles.countryBody}>
                <div className={styles.countryHeading}>
                  <span
                    className={`${styles.countryIcon} ${definition.tone}`}
                    aria-hidden="true"
                  >
                    <i className={`fa-solid ${definition.icon}`} />
                  </span>
                  <h3>{country.name}</h3>
                </div>
                <ul>
                  {points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ActionLink
                  href={definition.href}
                  variant="outline"
                  size="compact"
                >
                  {country.cta}{" "}
                  <i
                    className="fa-solid fa-arrow-right"
                    aria-hidden="true"
                  />
                </ActionLink>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function FailureTimeline({ copy }: CopyProps) {
  return (
    <section className={styles.section} aria-labelledby="timeline-heading">
      <h2 id="timeline-heading">{copy.timeline.title}</h2>
      <Card elevated borderless>
        <CardBody>
          <div className={styles.timeline}>
            <Badge>2015</Badge>
            <span aria-hidden="true">→</span>
            <Badge variant="info">{copy.timeline.norway}</Badge>
            <span aria-hidden="true">→</span>
            <Badge>2016</Badge>
            <span>{copy.timeline.refused}</span>
            <span aria-hidden="true">→</span>
            <Badge>2022</Badge>
            <span>{copy.timeline.germany}</span>
            <span aria-hidden="true">→</span>
            <Badge variant="success">2026</Badge>
            <span>{copy.timeline.noReturn}</span>
          </div>
          <p className={styles.timelineLink}>
            <a href="central-authorities#timeline-heading">
              {copy.timeline.fullTimeline}
            </a>
          </p>
        </CardBody>
      </Card>
    </section>
  );
}

export function ReadMore({ copy }: CopyProps) {
  const links = [
    {
      href: "central-authorities",
      label: copy.readMore.centralAuthorities,
      icon: "fa-envelope-open-text",
    },
    {
      href: "/abduction-norway.html",
      label: copy.readMore.norway,
      icon: "fa-gavel",
    },
    {
      href: "/abduction-germany.html",
      label: copy.readMore.germany,
      icon: "fa-file-lines",
    },
  ] as const;

  return (
    <section className={styles.section} aria-labelledby="read-more-heading">
      <h2 id="read-more-heading">{copy.readMore.title}</h2>
      <div className={styles.readMoreGrid}>
        {links.map((link) => (
          <Card key={link.href}>
            <CardBody className={styles.readMoreBody}>
              <ActionLink href={link.href} variant="outline">
                <i className={`fa-solid ${link.icon}`} aria-hidden="true" />{" "}
                {link.label}
              </ActionLink>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
