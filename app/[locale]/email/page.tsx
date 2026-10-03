import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { PageProps } from "@/app/types";
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
        <section className="py-3" aria-labelledby="preferred-addresses-heading">
          <h2 id="preferred-addresses-heading" className="h4 mb-3">
            {t("useTheseAddresses")}
          </h2>
          <div className="row g-3">
            {cards.map((card) => (
              <div key={card.title} className="col-md-6">
                <div className="card h-100 bg-body-secondary border-secondary">
                  <div className="card-body">
                    <h3 className="h6 card-title">{card.title}</h3>
                    <p className="card-text mb-0">
                      {card.descriptionBefore}
                      <a href={`mailto:${card.email}`}>{card.email}</a>
                      {card.descriptionAfter}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="py-3" aria-labelledby="automated-senders-heading">
          <h2 id="automated-senders-heading" className="h4 mb-3">
            {t("automatedHeading")}
          </h2>
          <div className="card border-warning bg-body-secondary">
            <div className="card-body">
              <p className="mb-2">{t("automatedDesc")}</p>
              <ul className="mb-0">
                {automatedList.map((email) => (
                  <li key={email}>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteWidgetsScript printPdf coffeeFab />
    </div>
  );
}
