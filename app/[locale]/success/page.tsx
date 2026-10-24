import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutResultCard from "@/components/CheckoutResultCard";
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

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/success">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({
    locale,
    namespace: "checkoutResult.success",
  });

  return {
    ...localizedPageMetadata(
      "success",
      locale,
      t("metadataTitle"),
      t("metadataDescription"),
    ),
    robots: NON_INDEXABLE_ROBOTS,
  };
}

export default async function SuccessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/success">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("checkoutResult.success");
  const query = await searchParams;
  const sessionId = firstSearchParam(query.session_id)?.trim().slice(0, 200);

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <main id="main-content" className={layout.main}>
        <Container>
          <CheckoutResultCard
            iconClass="fa-solid fa-circle-check"
            tone="success"
            title={t("title")}
            actions={
              <>
                <ActionLink
                  href={STRIPE_DIRECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("payAgain")}
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
            {sessionId ? (
              <p id="checkout-session-ref" className={layout.breakable}>
                <strong>{t("referenceLabel")}</strong> {sessionId}
              </p>
            ) : (
              <p id="checkout-session-ref" hidden />
            )}
            <p>
              {t("contactBefore")}{" "}
              <a href="mailto:invoice@bababou.com">invoice@bababou.com</a>.
            </p>
          </CheckoutResultCard>
        </Container>
      </main>
    </div>
  );
}
