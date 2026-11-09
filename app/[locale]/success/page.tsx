import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CheckoutResultCard from "@/components/CheckoutResultCard";
import CheckoutSessionReference from "@/components/CheckoutSessionReference";
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

// All supported locales are rendered at build time. The optional receipt
// reference is display-only and read by a client island.
export const dynamic = "force-static";

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
    // Never leak Stripe session_id in cross-origin Referer headers.
    referrer: "no-referrer",
  };
}

export default async function SuccessPage({
  params,
}: PageProps<"/[locale]/success">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("checkoutResult.success");

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
            <Suspense fallback={<p id="checkout-session-ref" hidden />}>
              <CheckoutSessionReference
                label={t("referenceLabel")}
                className={layout.breakable}
              />
            </Suspense>
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
