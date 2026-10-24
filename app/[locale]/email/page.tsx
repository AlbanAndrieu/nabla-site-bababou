import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import surface from "@/components/ui/Surface.module.css";
import { routing } from "@/i18n/routing";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";

type EmailCard = {
  title: string;
  email: string;
  descriptionBefore: string;
  descriptionAfter: string;
};

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/email">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "email" });

  return localizedPageMetadata(
    "email",
    locale,
    t("metadataTitle"),
    t("metadataDescription"),
  );
}

export default async function EmailPage({
  params,
}: PageProps<"/[locale]/email">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("email");
  const cards = t.raw("cards") as EmailCard[];
  const automatedList = t.raw("automatedList") as string[];

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <main id="main-content" className={layout.main}>
        <Container>
          <header className={layout.header}>
            <h1 className={layout.title}>{t("title")}</h1>
          </header>

          <section
            className={layout.section}
            aria-labelledby="preferred-addresses-heading"
          >
            <h2
              id="preferred-addresses-heading"
              className={layout.sectionTitle}
            >
              {t("useTheseAddresses")}
            </h2>
            <div className={layout.twoColumnGrid}>
              {cards.map((card) => (
                <article
                  key={`${card.title}:${card.email}`}
                  className={`${surface.card} ${surface.muted}`}
                >
                  <h3 className={surface.title}>{card.title}</h3>
                  <p className={surface.text}>
                    {card.descriptionBefore}
                    <a href={`mailto:${card.email}`}>{card.email}</a>
                    {card.descriptionAfter}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            className={layout.section}
            aria-labelledby="automated-senders-heading"
          >
            <h2
              id="automated-senders-heading"
              className={layout.sectionTitle}
            >
              {t("automatedHeading")}
            </h2>
            <div
              className={`${surface.card} ${surface.muted} ${surface.warning}`}
            >
              <p className={surface.text}>{t("automatedDesc")}</p>
              <ul>
                {automatedList.map((email) => (
                  <li key={email}>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Container>
      </main>
      <SiteWidgetsScript printPdf coffeeFab />
    </div>
  );
}
