import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

type LinkPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LinkPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "linkPage" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: {
      canonical: canonicalPagePath("link", locale),
      languages: {
        en: canonicalPagePath("link", "en"),
        fr: canonicalPagePath("link", "fr"),
      },
    },
  };
}

export default async function LinkPage({ params }: LinkPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const [site, t] = await Promise.all([
    getTranslations("site"),
    getTranslations("linkPage"),
  ]);

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {site("skipToMainContent")}
      </a>
      <main id="main-content" className="container py-4 pb-5">
        <header className="mb-4 text-center">
          <h1 className="h2 mb-2">{t("title")}</h1>
        </header>

        <section className="py-2" aria-labelledby="profiles-grid-heading">
          <h2 id="profiles-grid-heading" className="visually-hidden">
            {t("profilesHeading")}
          </h2>
          <div className="tools-grid">
            <div className="tool-item">
              <a
                href="https://github.com/AlbanAndrieu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/logo-github-simple.png"
                  alt="GitHub"
                  width={220}
                  height={220}
                />
                <h4>GitHub</h4>
              </a>
            </div>
          </div>
        </section>

        <section className="py-4 mt-2" aria-labelledby="freelance-refs-heading">
          <h2 id="freelance-refs-heading" className="h4 text-center mb-4">
            {t("freelanceHeading")}
          </h2>
          <div className="tools-grid">
            <div className="tool-item">
              <a
                href="https://www.linkedin.com/in/nabla/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/fontawesome-free-7.1.0-web/svgs/brands/linkedin-in.svg"
                  alt="LinkedIn"
                  width={448}
                  height={512}
                />
                <h4>LinkedIn</h4>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteWidgetsScript printPdf coffeeFab axeptio />
    </div>
  );
}
