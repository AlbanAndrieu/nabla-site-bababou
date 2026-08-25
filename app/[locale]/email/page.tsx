import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { pageAlternates } from "@/lib/sitePageCatalog";

const PUBLIC_CONTACT_EMAIL = "aa@bababou.com";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/email">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "email" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: pageAlternates("email", locale),
  };
}

export default async function EmailPage({
  params,
}: PageProps<"/[locale]/email">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("email");
  const mailto = `mailto:${PUBLIC_CONTACT_EMAIL}`;

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className="container py-4 pb-5">
        <header className="mb-4">
          <h1 className="h2 mb-2">{t("title")}</h1>
          <p className="lead text-secondary mb-0">{t("intro")}</p>
        </header>

        <section className="py-3" aria-labelledby="public-email-heading">
          <div className="card bg-body-secondary border-secondary">
            <div className="card-body">
              <h2 id="public-email-heading" className="h4 card-title">
                {t("contactTitle")}
              </h2>
              <p className="card-text">{t("contactDescription")}</p>
              <a className="btn btn-primary" href={mailto}>
                {t("contactCta")}
              </a>
            </div>
          </div>
        </section>

        <section className="py-3" aria-labelledby="email-privacy-heading">
          <h2 id="email-privacy-heading" className="h4 mb-3">
            {t("privacyTitle")}
          </h2>
          <p>{t("privacyDescription")}</p>
        </section>
      </main>
    </div>
  );
}
