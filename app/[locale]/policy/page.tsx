import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import surface from "@/components/ui/Surface.module.css";
import { routing } from "@/i18n/routing";
import { localizedPolicyIndexPath } from "@/lib/policyRoutePaths";
import { getNativePolicyCopy, localizedPolicyPath } from "@/lib/nativePolicyCatalog";
import { POLICY_PAGE_SLUGS } from "@/lib/policyPages";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/policy">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "policyIndexPage" });
  const canonical = localizedPolicyIndexPath(locale);
  const languages = Object.fromEntries(
    routing.locales.map((alternateLocale) => [
      alternateLocale,
      localizedPolicyIndexPath(alternateLocale),
    ]),
  );

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": localizedPolicyIndexPath(routing.defaultLocale),
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: t("metadataTitle"),
      description: t("metadataDescription"),
      siteName: "Bababou",
    },
    twitter: {
      card: "summary",
      title: t("metadataTitle"),
      description: t("metadataDescription"),
    },
  };
}

export default async function PolicyIndexPage({
  params,
}: PageProps<"/[locale]/policy">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "policyIndexPage" });

  return (
    <>
      <TopAnchor />
      <main
        id="main-content"
        className={`site-content-page ${layout.main}`}
        lang={locale}
      >
        <Container>
          <header className={layout.centeredHeader}>
            <h1 className={layout.title}>{t("heading")}</h1>
            <p className={layout.lead}>{t("intro")}</p>
          </header>

          <div className={layout.twoColumnGrid}>
            {POLICY_PAGE_SLUGS.map((policy) => {
              const policyCopy = getNativePolicyCopy(policy, locale);
              const href = localizedPolicyPath(policy, locale);

              return (
                <article className={surface.card} key={policy}>
                  <h2 className={surface.title}>{policyCopy.title}</h2>
                  <p className={`${surface.text} ${surface.grow}`}>
                    {policyCopy.metadataDescription}
                  </p>
                  <ActionLink
                    href={href}
                    variant="outline"
                    size="compact"
                  >
                    {t("open")}
                  </ActionLink>
                </article>
              );
            })}
          </div>
        </Container>
      </main>
    </>
  );
}
