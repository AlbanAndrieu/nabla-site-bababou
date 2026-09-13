import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import CopyPageLinkButton from "@/components/CopyPageLinkButton";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import Badge from "@/components/ui/Badge";
import Card, { CardBody } from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import { routing } from "@/i18n/routing";
import { canonicalPagePath, pageAlternates } from "@/lib/sitePageCatalog";
import styles from "./page.module.css";

const TITLE =
  "Central Authorities Failed: A Father in Europe Could Not Have His Child Located or Returned";
const DESCRIPTION =
  "Summary of Central Authority failures in France, Norway and Germany: no location of the child, return refused or not registered, years of delays. A father’s experience under the Hague Convention.";

const countries = [
  {
    name: "France",
    icon: "fa-landmark",
    tone: styles.france,
    href: "/central-authorities.html",
    cta: "Reaching Central Authorities",
    points: [
      "Years of delay before meaningful action, including contact with the German authority only in 2026.",
      "The case was initially treated as outside French competence for a Norway→Germany displacement; return to France had to be insisted on.",
      "No location of the child by French authorities.",
    ],
  },
  {
    name: "Norway",
    icon: "fa-gavel",
    tone: styles.norway,
    href: "/abduction-norway.html",
    cta: "Abduction in Norway",
    points: [
      "Oslo District Court refused the petition for return in 2016 on Hague Convention grounds, including Articles 3, 12, 13 and 20.",
      "No location of the child by Norwegian authorities and no effective route that resulted in return.",
    ],
  },
  {
    name: "Germany",
    icon: "fa-ban",
    tone: styles.germany,
    href: "/abduction-germany.html",
    cta: "Abduction in Germany",
    points: [
      "The Central Authority refused to register the return request, referring to visitation, Article 12 delay and withdrawal of the request.",
      "The German authority reported no trace of a 2022 return request and assumed return was sought to Norway rather than France.",
      "No location of the child by German authorities; the child was located independently in Frankfurt.",
    ],
  },
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/central-authorities-failures">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const alternates = pageAlternates("central-authorities-failures", locale);
  return {
    title: `${TITLE} | Bababou`,
    description: DESCRIPTION,
    alternates,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: canonicalPagePath("central-authorities-failures", locale),
      type: "article",
    },
  };
}

export default async function CentralAuthoritiesFailuresPage({
  params,
}: PageProps<"/[locale]/central-authorities-failures">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={styles.page}>
        <Container>
          <header className={styles.hero} aria-labelledby="headline">
            <div className={styles.badges} aria-label="Article scope">
              <Badge variant="info">Hague Convention</Badge>
              <Badge>France</Badge>
              <Badge>Norway</Badge>
              <Badge>Germany</Badge>
            </div>
            <h1 id="headline">{TITLE}</h1>
            <p className={styles.lead}>
              Summary of institutional failures across three countries — no
              location of the child, return refused or not registered, and
              years of delay.
            </p>
            <div className={styles.heroActions}>
              <ActionLink
                href="/central-authorities.html"
                variant="outline"
                size="compact"
              >
                Central Authorities
              </ActionLink>
              <CopyPageLinkButton />
            </div>
          </header>

          <section className={styles.section} aria-labelledby="in-short-heading">
            <h2 id="in-short-heading">In short</h2>
            <Card elevated borderless>
              <CardBody className={styles.summaryBody}>
                <ul>
                  <li>
                    <strong>No authority located the child.</strong> France,
                    Norway and Germany did not locate the child; the location
                    in Germany was found independently.
                  </li>
                  <li>
                    <strong>Norway refused return.</strong> Oslo District Court
                    refused the Hague Convention return petition in 2016.
                  </li>
                  <li>
                    <strong>Germany refused to register the return request.</strong>{" "}
                    The German Central Authority did not register the request
                    for return to France, while the French authority initially
                    treated the Norway→Germany displacement as outside its
                    competence.
                  </li>
                  <li>
                    <strong>Years of delay.</strong> Central Authorities took
                    months or years to answer, and procedures restarted after
                    another cross-border move.
                  </li>
                </ul>
              </CardBody>
            </Card>
          </section>

          <section
            className={styles.section}
            aria-labelledby="failures-by-country-heading"
          >
            <h2 id="failures-by-country-heading">Failures by country</h2>
            <div className={styles.countryGrid}>
              {countries.map((country) => (
                <Card key={country.name} elevated className={styles.countryCard}>
                  <CardBody className={styles.countryBody}>
                    <div className={styles.countryHeading}>
                      <span
                        className={`${styles.countryIcon} ${country.tone}`}
                        aria-hidden="true"
                      >
                        <i className={`fa-solid ${country.icon}`} />
                      </span>
                      <h3>{country.name}</h3>
                    </div>
                    <ul>
                      {country.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                    <ActionLink
                      href={country.href}
                      variant="outline"
                      size="compact"
                    >
                      {country.cta}{" "}
                      <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                    </ActionLink>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>

          <section className={styles.section} aria-labelledby="timeline-heading">
            <h2 id="timeline-heading">Timeline</h2>
            <Card elevated borderless>
              <CardBody>
                <div className={styles.timeline}>
                  <Badge>2015</Badge>
                  <span aria-hidden="true">→</span>
                  <Badge variant="info">Norway</Badge>
                  <span aria-hidden="true">→</span>
                  <Badge>2016</Badge>
                  <span>Return refused (Oslo)</span>
                  <span aria-hidden="true">→</span>
                  <Badge>2022</Badge>
                  <span>Child in Germany</span>
                  <span aria-hidden="true">→</span>
                  <Badge variant="success">2026</Badge>
                  <span>Still no return</span>
                </div>
                <p className={styles.timelineLink}>
                  <a href="/central-authorities.html#timeline-heading">
                    Full timeline on Central Authorities page
                  </a>
                </p>
              </CardBody>
            </Card>
          </section>

          <section className={styles.section} aria-labelledby="read-more-heading">
            <h2 id="read-more-heading">Read the full story</h2>
            <div className={styles.readMoreGrid}>
              <Card>
                <CardBody>
                  <h3>Reaching Central Authorities</h3>
                  <p>Timeline and exchanges with the authorities involved.</p>
                  <ActionLink href="/central-authorities.html" variant="outline">
                    Read more
                  </ActionLink>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <h3>Abduction in Norway</h3>
                  <p>Legal grounds invoked in the refusal of return.</p>
                  <ActionLink href="/abduction-norway.html" variant="outline">
                    Read more
                  </ActionLink>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <h3>Abduction in Germany</h3>
                  <p>Return request and requests for written explanations.</p>
                  <ActionLink href="/abduction-germany.html" variant="outline">
                    Read more
                  </ActionLink>
                </CardBody>
              </Card>
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}
