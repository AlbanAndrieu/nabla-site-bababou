import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/ContactHero";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import styles from "./page.module.css";

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
      <main
        id="main-content"
        className={styles.page}
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

        <section className={styles.section} id="contact-details">
          <h2 className={styles.sectionTitle}>{t("information.title")}</h2>
          <p className={styles.sectionSubtitle}>{t("information.subtitle")}</p>
          <div className={styles.methods}>
            <a
              className={styles.method}
              href="mailto:aa@bababou.com?Subject=DevSecOps%20Inquiry"
            >
              <div className={styles.icon}>
                <i className="fas fa-envelope" aria-hidden="true" />
              </div>
              <div className={styles.info}>
                <h3>{t("methods.email.title")}</h3>
                <p>{t("methods.email.value")}</p>
              </div>
            </a>
            <div className={styles.method}>
              <div className={styles.icon}>
                <i className="fas fa-phone" aria-hidden="true" />
              </div>
              <div className={styles.info}>
                <h3>{t("methods.phone.title")}</h3>
                <p>{t("methods.phone.value")}</p>
              </div>
            </div>
            <a
              className={styles.method}
              href="https://calendly.com/alban-andrieu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.icon}>
                <i className="fas fa-calendar-plus" aria-hidden="true" />
              </div>
              <div className={styles.info}>
                <h3>{t("methods.calendar.title")}</h3>
                <p>{t("methods.calendar.value")}</p>
              </div>
            </a>
          </div>
        </section>

        <section className={styles.proof}>
          <h2 className={styles.sectionTitle}>{t("cv.title")}</h2>
          <p>{t("cv.description")}</p>
          <div className={"cv-page-links " + styles.cvLinks}>
            {["full", "medium", "small"].map((size) => (
              <ActionLink
                href={`/cv/cv-${size}-${locale}.html`}
                target="_blank"
                key={size}
                rel="noopener"
                variant="outline"
                size="compact"
              >
                {t(`cv.${size}`)}
              </ActionLink>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <article
            className={styles.location}
            id="location"
            itemScope
            itemType="https://schema.org/PostalAddress"
          >
            <h2 className={styles.sectionTitle}>{t("location.title")}</h2>
            <p className={"location-address " + styles.locationAddress}>
              <i className="fas fa-map-marker-alt" aria-hidden="true" />{" "}
              <span itemProp="streetAddress">{t("location.district")}</span> ·{" "}
              <span itemProp="postalCode">92800</span>{" "}
              <span itemProp="addressLocality">Puteaux</span> ·{" "}
              <span itemProp="addressRegion">Île-de-France</span>,{" "}
              <span itemProp="addressCountry">France</span>
            </p>
            <p>{t("location.description")}</p>
            <div className={"map-container " + styles.mapContainer}>
              <iframe
                title={t("location.mapTitle")}
                src="https://www.openstreetmap.org/export/embed.html?bbox=2.135%2C48.845%2C2.285%2C48.93&layer=mapnik&marker=48.8919%2C2.238"
                loading="lazy"
              />
            </div>
            <p className={"contact-map-caption " + styles.mapCaption}>
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
