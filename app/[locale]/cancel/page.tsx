import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutResultCard from "@/components/CheckoutResultCard";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink, {
  actionClassName,
} from "@/components/ui/ActionLink";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import { routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  NON_INDEXABLE_ROBOTS,
} from "@/lib/sitePageCatalog";
import { localizedPageMetadata } from "@/lib/siteSocialMetadata";

const STRIPE_DIRECT_URL = "https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/cancel">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({
    locale,
    namespace: "checkoutResult.cancel",
  });

  return {
    ...localizedPageMetadata(
      "cancel",
      locale,
      t("metadataTitle"),
      t("metadataDescription"),
    ),
    robots: NON_INDEXABLE_ROBOTS,
  };
}

export default async function CancelPage({
  params,
}: PageProps<"/[locale]/cancel">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("checkoutResult.cancel");

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <SkipToMainContent />
      <main id="main-content" className={layout.main}>
        <Container>
          <CheckoutResultCard
            iconClass="fa-solid fa-circle-xmark"
            tone="warning"
            title={t("title")}
            actions={
              <>
                <ActionLink
                  href={STRIPE_DIRECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("retryPayment")}
                </ActionLink>
                <Link
                  className={actionClassName("outline")}
                  href={canonicalPagePath("index", locale)}
                >
                  {t("backSite")}
                </Link>
              </>
            }
          >
            <p className={layout.lead}>{t("message")}</p>
            <p>{t("retryMessage")}</p>
          </CheckoutResultCard>
        </Container>
      </main>
    </div>
  );
}
