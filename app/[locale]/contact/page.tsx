import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/ContactHero";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { pageAlternates } from "@/lib/sitePageCatalog";

const PUBLIC_CONTACT_EMAIL = "aa@bababou.com";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "contactPage" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("contact", locale),
  };
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("contactPage");
  const contactHref = `mailto:${PUBLIC_CONTACT_EMAIL}`;

  return (
    <div className="site-content-page page-contact page-dark">
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content">
        <ContactHero contactHref={contactHref} />

        <section
          className="contact-section container"
          id="contact-details"
          aria-labelledby="contact-details-heading"
        >
          <h2 className="section-title" id="contact-details-heading">
            {t("information.title")}
          </h2>
          <p className="section-subtitle">{t("information.subtitle")}</p>
          <div className="contact-methods">
            <a className="contact-method" href={contactHref}>
              <div className="contact-icon">
                <i className="fas fa-envelope" aria-hidden="true" />
              </div>
              <div className="contact-info">
                <h3>{t("methods.email.title")}</h3>
                <p>{t("methods.email.value")}</p>
              </div>
            </a>
          </div>
        </section>

        <section
          className="contact-section container"
          aria-labelledby="general-location-heading"
        >
          <h2 className="section-title" id="general-location-heading">
            {t("location.title")}
          </h2>
          <p className="section-subtitle">{t("location.value")}</p>
          <p>{t("location.description")}</p>
        </section>

        <section
          className="contact-section container"
          aria-labelledby="contact-privacy-heading"
        >
          <h2 className="section-title" id="contact-privacy-heading">
            {t("privacy.title")}
          </h2>
          <p>{t("privacy.description")}</p>
        </section>
      </main>
    </div>
  );
}
