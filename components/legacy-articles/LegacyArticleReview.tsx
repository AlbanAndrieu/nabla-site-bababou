import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "next-intl/server";

import TopAnchor from "@/components/TopAnchor";
import LegacyAssociationsSection from "@/components/home/LegacyAssociationsSection";
import Container from "@/components/ui/Container";
import type { AppLocale } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import styles from "./LegacyArticleReview.module.css";

export type LegacyArticleKind = "fathers" | "norway" | "germany";

type Section = { heading: string; body: string };
type ArticleCopy = {
  title: string;
  description: string;
  intro: string;
  sections: Record<string, Section>;
};
type ArticleCatalog = {
  reviewNotice: string;
  originalPage: string;
  originalHint: string;
  legalHeading: string;
  relatedHeading: string;
  references: Record<ReferenceKey, string>;
  related: Record<RelatedSlug, string>;
  fathers: ArticleCopy;
  norway: ArticleCopy;
  germany: ArticleCopy;
};

const OFFICIAL_REFERENCES = {
  hague1980: "https://www.hcch.net/en/instruments/conventions/full-text/?cid=24",
  hague1996: "https://www.hcch.net/en/instruments/conventions/full-text/?cid=70",
  echr: "https://www.echr.coe.int/documents/d/echr/convention_ENG",
  hudoc: "https://hudoc.echr.coe.int/",
  childRights:
    "https://www.ohchr.org/en/instruments-mechanisms/instruments/convention-rights-child",
} as const;
type ReferenceKey = keyof typeof OFFICIAL_REFERENCES;

const RELATED = [
  "central-authorities",
  "central-authorities-failures",
  "nre",
  "people-contacted",
] as const;
type RelatedSlug = (typeof RELATED)[number];

/**
 * These are independent, NOINDEX React review routes, not complete legal
 * transcriptions. Historic HTML and its document links stay authoritative
 * until parity and owner approval. No PDF/Office links are imported here.
 */
const ARTICLES = {
  fathers: {
    original: "/for-fathers.html",
    sections: ["context", "rights", "obstacles", "support"],
    references: ["echr", "hague1980", "hague1996", "childRights"],
  },
  norway: {
    original: "/abduction-norway.html",
    sections: ["scope", "law", "decision", "documents"],
    references: ["hague1980", "hudoc", "echr"],
  },
  germany: {
    original: "/abduction-germany.html",
    sections: ["scope", "article27", "residence", "documents"],
    references: ["hague1980", "hague1996", "echr"],
  },
} as const satisfies Record<
  LegacyArticleKind,
  { original: string; sections: readonly string[]; references: readonly ReferenceKey[] }
>;

async function articleCatalog(locale: AppLocale): Promise<ArticleCatalog> {
  const messages = await getMessages({ locale });
  return messages.legacyArticlesPage as unknown as ArticleCatalog;
}

export async function reviewArticleMetadata(
  locale: AppLocale,
  kind: LegacyArticleKind,
): Promise<Metadata> {
  const copy = (await articleCatalog(locale))[kind];
  return {
    title: copy.title,
    description: copy.description,
    // The published English HTML remains the authoritative indexed original.
    // Prevent four partial summaries from competing as canonical documents.
    robots: { index: false, follow: false },
    alternates: { canonical: ARTICLES[kind].original },
  };
}

export default async function LegacyArticleReview({
  locale,
  kind,
}: {
  locale: AppLocale;
  kind: LegacyArticleKind;
}) {
  const copy = await articleCatalog(locale);
  const article = copy[kind];
  const config = ARTICLES[kind];

  return (
    <>
      <TopAnchor />
      <main id="main-content" className={styles.page} lang={locale}>
        <Container>
          <header className={styles.hero}>
            <p className={styles.routeLabel}>{copy.reviewNotice}</p>
            <h1>{article.title}</h1>
            <p className={styles.lead}>{article.intro}</p>
            <p>
              <a className={styles.archiveLink} href={config.original}>
                {copy.originalPage}
              </a>
            </p>
            <p className={styles.caution}>{copy.originalHint}</p>
          </header>

          <div className={styles.sectionGrid} data-testid="article-review-sections">
            {config.sections.map((key) => {
              const section = article.sections[key];
              if (!section) {
                throw new Error("Missing " + kind + " editorial section: " + key);
              }
              return (
                <section key={key} className={styles.section} aria-labelledby={kind + "-" + key}>
                  <h2 id={kind + "-" + key}>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              );
            })}
          </div>

          {kind === "fathers" ? <LegacyAssociationsSection locale={locale} /> : null}

          <section className={styles.references} aria-labelledby="review-legal-heading">
            <h2 id="review-legal-heading">{copy.legalHeading}</h2>
            <ul>
              {config.references.map((key) => (
                <li key={key}>
                  <a href={OFFICIAL_REFERENCES[key]} target="_blank" rel="noopener noreferrer">
                    {copy.references[key]}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <nav className={styles.related} aria-label={copy.relatedHeading}>
            <h2>{copy.relatedHeading}</h2>
            <ul>
              {RELATED.map((slug) => (
                <li key={slug}>
                  <Link href={canonicalPagePath(slug, locale)}>
                    {copy.related[slug]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </main>
    </>
  );
}
