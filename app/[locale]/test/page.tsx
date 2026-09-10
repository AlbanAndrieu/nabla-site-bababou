import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import surface from "@/components/ui/Surface.module.css";
import { routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  NON_INDEXABLE_ROBOTS,
} from "@/lib/sitePageCatalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/test">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "testSurface" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    robots: NON_INDEXABLE_ROBOTS,
  };
}

export default async function TestPage({
  params,
}: PageProps<"/[locale]/test">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("testSurface");

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={layout.main}>
        <Container>
          <header className={layout.header}>
            <h1 className={layout.title}>{t("title")}</h1>
            <p className={layout.lead}>{t("lead")}</p>
          </header>

          <section className={layout.section} aria-labelledby="osint-heading">
            <h2 id="osint-heading" className={layout.sectionTitle}>
              {t("visualizationTitle")}
            </h2>
            <div
              id="arf-viz-body"
              className={`${surface.card} ${surface.muted}`}
            >
              <div id="arf-viz-header">{t("visualizationPending")}</div>
            </div>
          </section>

          <section
            className={layout.section}
            aria-labelledby="test-contact-heading"
          >
            <h2 id="test-contact-heading" className={layout.sectionTitle}>
              {t("contactTitle")}
            </h2>
            <ActionLink
              href={canonicalPagePath("contact", locale)}
              size="compact"
              variant="outline"
            >
              {t("contactLink")}
            </ActionLink>
          </section>
        </Container>
      </main>
    </div>
  );
}
