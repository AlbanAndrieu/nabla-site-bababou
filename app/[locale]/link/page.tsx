import Icon from "@/components/ui/Icon";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/link">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "linkPage" });

  return localizedPageMetadata(
    "link",
    locale,
    t("metadataTitle"),
    t("metadataDescription"),
  );
}

export default async function LinkPage({
  params,
}: PageProps<"/[locale]/link">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("linkPage");
  const items = [
    {
      key: "home",
      href: canonicalPagePath("index", locale),
      icon: "home",
    },
    {
      key: "contact",
      href: canonicalPagePath("contact", locale),
      icon: "mail",
    },
    {
      key: "email",
      href: canonicalPagePath("email", locale),
      icon: "at-sign",
    },
    { key: "rss", href: "/feed.xml", icon: "rss" },
    {
      key: "eleonoreRss",
      href: "/eleonore-feed.xml",
      icon: "rss",
    },
  ] as const;

  return (
    <div>
      <TopAnchor />
      <main id="main-content" className={layout.main}>
        <Container>
          <header className={layout.centeredHeader}>
            <h1 className={layout.title}>{t("title")}</h1>
            <p className={layout.lead}>{t("intro")}</p>
          </header>

          <section className={layout.section} aria-labelledby="site-links-heading">
            <h2 id="site-links-heading" className={layout.visuallyHidden}>
              {t("title")}
            </h2>
            <div className={styles.grid}>
              {items.map((item) => (
                <div className={styles.card} key={item.key}>
                  <Link href={item.href} className={styles.cardLink}>
                    <Icon name={item.icon} className={styles.icon} />
                    <h3>{t(`items.${item.key}.title`)}</h3>
                    <p>{t(`items.${item.key}.description`)}</p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
