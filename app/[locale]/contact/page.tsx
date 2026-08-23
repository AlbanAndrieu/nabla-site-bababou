import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ContactHero from "@/components/ContactHero";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

const socials = [
  [
    "linkedin",
    "LinkedIn",
    "https://www.linkedin.com/in/nabla/",
    "fab fa-linkedin",
  ],
  ["twitter", "Twitter", "https://twitter.com/AlbanAndrieu", "fab fa-twitter"],
  ["xing", "Xing", "https://www.xing.com/profile/Alban_Andrieu", "fab fa-xing"],
  ["github", "GitHub", "https://github.com/AlbanAndrieu", "fab fa-github"],
  ["docker", "Docker Hub", "https://hub.docker.com/u/nabla", "fab fa-docker"],
  [
    "stack",
    "Stack Exchange",
    "https://stackexchange.com/users/4652074/albanandrieu",
    "fab fa-stack-exchange",
  ],
  [
    "facebook",
    "Facebook",
    "https://www.facebook.com/alban.andrieu",
    "fab fa-facebook",
  ],
  [
    "instagram",
    "Instagram",
    "https://www.instagram.com/alban.andrieu/",
    "fab fa-instagram",
  ],
  [
    "calendly",
    "Calendly",
    "https://calendly.com/alban-andrieu",
    "fas fa-calendar-check",
  ],
  ["slack", "Slack", "https://nabla-siege.slack.com/", "fab fa-slack"],
  [
    "discord",
    "Discord",
    "https://discord.com/channels/985573491606691840/985573491606691845",
    "fab fa-discord",
  ],
  ["rss", "RSS", "/feed.xml", "fas fa-rss"],
] as const;

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: canonicalPagePath("contact", locale),
      languages: {
        en: canonicalPagePath("contact", "en"),
        fr: canonicalPagePath("contact", "fr"),
      },
    },
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");
  return (
    <main
      id="main-content"
      className="site-content-page page-contact page-dark"
    >
      <span id="top" />
      <ContactHero
        contactCta={t("hero.contactCta")}
        contactHref="#contact-details"
        current={t("hero.current")}
        cvCta={t("hero.cvCta")}
        cvHref={canonicalPagePath("cv", locale)}
        experience={t("hero.experience")}
        intro={t("intro")}
        profileAlt={t("hero.profileAlt")}
        subtitle={t("hero.subtitle")}
        title={t("hero.title")}
      />

      <section id="contact-details" className="container py-5">
        <div className="row g-4 align-items-start">
          <div className="col-lg-7">
            <h2>{t("details.title")}</h2>
            <p>{t("details.intro")}</p>
            <ul className="list-unstyled contact-list">
              <li>
                <i className="fas fa-envelope" aria-hidden="true" />{" "}
                <a href="mailto:alban.andrieu@gmail.com">
                  alban.andrieu@gmail.com
                </a>
              </li>
              <li>
                <i className="fas fa-map-marker-alt" aria-hidden="true" />{" "}
                {t("details.location")}
              </li>
              <li>
                <i className="fas fa-calendar-check" aria-hidden="true" />{" "}
                <a
                  href="https://calendly.com/alban-andrieu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("details.schedule")}
                </a>
              </li>
            </ul>
          </div>
          <div className="col-lg-5 text-center">
            <Image
              src="/assets/nabla/nabla-4.png"
              alt={t("hero.profileAlt")}
              width={280}
              height={280}
              className="img-fluid rounded-circle"
            />
          </div>
        </div>
      </section>

      <section className="container pb-5" aria-labelledby="social-title">
        <h2 id="social-title">{t("social.title")}</h2>
        <div className="d-flex flex-wrap gap-3 social-links">
          {socials.map(([key, label, href, icon]) => (
            <a
              key={key}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={label}
              className="btn btn-outline-light"
            >
              <i className={icon} aria-hidden="true" /> {label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
