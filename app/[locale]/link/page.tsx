import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";

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
      icon: "fas fa-home",
    },
    {
      key: "contact",
      href: canonicalPagePath("contact", locale),
      icon: "fas fa-envelope",
    },
    {
      key: "email",
      href: canonicalPagePath("email", locale),
      icon: "fas fa-at",
    },
    { key: "rss", href: "/feed.xml", icon: "fas fa-rss" },
  ] as const;

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className="container py-4 pb-5">
        <header className="mb-4 text-center">
          <h1 className="h2 mb-2">{t("title")}</h1>
          <p className="lead text-secondary">{t("intro")}</p>
        </header>

        <section className="py-2" aria-labelledby="site-links-heading">
          <h2 id="site-links-heading" className="visually-hidden">
            {t("title")}
          </h2>
          <div className="tools-grid">
            {items.map((item) => (
              <div className="tool-item" key={item.key}>
                <Link href={item.href}>
                  <i className={item.icon} aria-hidden="true" />
                  <h3>{t(`items.${item.key}.title`)}</h3>
                  <p>{t(`items.${item.key}.description`)}</p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
