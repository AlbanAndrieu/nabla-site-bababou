import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import surface from "@/components/ui/Surface.module.css";
import { routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  NON_INDEXABLE_ROBOTS,
} from "@/lib/sitePageCatalog";

export const metadata: Metadata = {
  title: "Bababou migration test surface",
  robots: NON_INDEXABLE_ROBOTS,
};

export default async function TestPage({
  params,
}: PageProps<"/[locale]/test">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" role="main" className={layout.main}>
        <Container>
          <header className={layout.header}>
            <h1 className={layout.title}>OSINT framework test surface</h1>
            <p className={layout.lead}>
              Non-indexed development route used to validate shared Next.js layout,
              routing, and legacy visualization integration during migration.
            </p>
          </header>

          <section className={layout.section} aria-labelledby="osint-heading">
            <h2 id="osint-heading" className={layout.sectionTitle}>
              OSINT framework placeholder
            </h2>
            <div
              id="arf-viz-body"
              className={`${surface.card} ${surface.muted}`}
            >
              <div id="arf-viz-header">
                Visualization integration pending migration.
              </div>
            </div>
          </section>

          <section
            className={layout.section}
            aria-labelledby="test-contact-heading"
          >
            <h2 id="test-contact-heading" className={layout.sectionTitle}>
              Public contact surface
            </h2>
            <p>
              <a href={canonicalPagePath("contact", locale)}>
                Open the localized Bababou contact page
              </a>
            </p>
          </section>
        </Container>
      </main>
    </div>
  );
}
