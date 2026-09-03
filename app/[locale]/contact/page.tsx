import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/ContactHero";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "contactPage" });

  return localizedPageMetadata(
    "contact",
    locale,
    t("meta.title"),
    t("meta.description"),
  );
}

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main
        id="main-content"
        className="site-content-page page-contact page-dark"
      >
        <ContactHero
          contactCta={t("hero.contactCta")}
          contactHref="#contact-details"
          current={t("hero.current")}
          experience={t("hero.experience")}
          intro={t("intro")}
          profileAlt={t("hero.profileAlt")}
          role={t("role")}
        />

        <section className="contact-section container" id="contact-details">
          <h2 className="section-title">{t("information.title")}</h2>
          <p className="section-subtitle">{t("information.subtitle")}</p>
          <div className="contact-methods">
            <a
              className="contact-method"
              href="mailto:aa@bababou.com?Subject=DevSecOps%20Inquiry"
            >
              <div className="contact-icon">
                <i className="fas fa-envelope" aria-hidden="true" />
              </div>
              <div className="contact-info">
                <h3>{t("methods.email.title")}</h3>
                <p>{t("methods.email.value")}</p>
              </div>
            </a>
            <div className="contact-method">
              <div className="contact-icon">
                <i className="fas fa-phone" aria-hidden="true" />
              </div>
              <div className="contact-info">
                <h3>{t("methods.phone.title")}</h3>
                <p>{t("methods.phone.value")}</p>
              </div>
            </div>
            <a
              className="contact-method"
              href="https://calendly.com/alban-andrieu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="contact-icon">
                <i className="fas fa-calendar-plus" aria-hidden="true" />
              </div>
              <div className="contact-info">
                <h3>{t("methods.calendar.title")}</h3>
                <p>{t("methods.calendar.value")}</p>
              </div>
            </a>
          </div>
        </section>

        <section className="proof-section container">
          <h2 className="section-title">{t("cv.title")}</h2>
          <p>{t("cv.description")}</p>
          <div className="cv-page-links">
            <a
              className="btn btn-primary"
              href={canonicalPagePath("cv", locale)}
            >
              {t("cv.cta")}
            </a>
            {["full", "medium", "small"].map((size) => (
              <a
                className="btn btn-outline-primary"
                href={`/cv/cv-${size}-${locale}.html`}
                target="_blank"
                key={size}
                rel="noopener"
              >
                {t(`cv.${size}`)}
              </a>
            ))}
          </div>
        </section>

        <section className="contact-section container">
          <article
            className="location-section"
            id="location"
            itemScope
            itemType="https://schema.org/PostalAddress"
          >
            <h2 className="section-title">{t("location.title")}</h2>
            <p className="location-address">
              <i className="fas fa-map-marker-alt" aria-hidden="true" />{" "}
              <span itemProp="streetAddress">{t("location.district")}</span> ·{" "}
              <span itemProp="postalCode">92800</span>{" "}
              <span itemProp="addressLocality">Puteaux</span> ·{" "}
              <span itemProp="addressRegion">Île-de-France</span>,{" "}
              <span itemProp="addressCountry">France</span>
            </p>
            <p>{t("location.description")}</p>
            <div className="map-container">
              <iframe
                title={t("location.mapTitle")}
                src="https://www.openstreetmap.org/export/embed.html?bbox=2.135%2C48.845%2C2.285%2C48.93&layer=mapnik&marker=48.8919%2C2.238"
                loading="lazy"
              />
            </div>
            <p className="contact-map-caption">
              {t("location.caption")}{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap
              </a>{" "}
              {t("location.contributors")}
            </p>
          </article>
        </section>
      </main>
    </>
  );
}
