import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

type EmailPageProps = {
  params: Promise<{ locale: string }>;
};

type EmailCard = {
  title: string;
  email: string;
  descriptionBefore: string;
  descriptionAfter: string;
};

export async function generateMetadata({
  params,
}: EmailPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "email" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: {
      canonical: canonicalPagePath("email", locale),
      languages: {
        en: canonicalPagePath("email", "en"),
        fr: canonicalPagePath("email", "fr"),
      },
    },
  };
}

export default async function EmailPage({ params }: EmailPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const [t, tSite] = await Promise.all([
    getTranslations("email"),
    getTranslations("site"),
  ]);
  const cards = t.raw("cards") as EmailCard[];
  const automatedList: string[] = t.raw("automatedList") as string[];
  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {tSite("skipToMainContent")}
      </a>
      <main id="main-content" className="container py-4 pb-5">
        <div className="content-shell">
          <header className="content-hero text-center mb-5">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p className="lead">{t("lead")}</p>
          </header>

          <div className="row g-4">
            {cards.map((card) => (
              <article className="col-lg-6" key={card.email}>
                <div className="content-card h-100">
                  <h2>{card.title}</h2>
                  <p>
                    {card.descriptionBefore}{" "}
                    <a href={`mailto:${card.email}`}>{card.email}</a>{" "}
                    {card.descriptionAfter}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <section className="content-card mt-4">
            <h2>{t("automatedTitle")}</h2>
            <ul>
              {automatedList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteWidgetsScript />
    </div>
  );
}
