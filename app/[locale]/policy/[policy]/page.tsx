import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import LegalPolicyContent from "@/components/policy/LegalPolicyContent";
import PrivacyPolicyContent from "@/components/policy/PrivacyPolicyContent";
import PublicPolicyContent from "@/components/policy/PublicPolicyContent";
import ServiceTermsContent from "@/components/policy/ServiceTermsContent";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import { type AppLocale, routing } from "@/i18n/routing";
import { getNativePolicyCopy, localizedPolicyPath } from "@/lib/nativePolicyCatalog";
import {
  getPolicyPage,
  isPolicyPageSlug,
  POLICY_PAGE_SLUGS,
  type PolicyPageSlug,
} from "@/lib/policyPages";

// Public editorial data is versioned with the deployment; no request-time SSR required.
export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    POLICY_PAGE_SLUGS.map((policy) => ({ locale, policy })),
  );
}

function localizedPolicyAlternates(policy: PolicyPageSlug) {
  return Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      localizedPolicyPath(policy, locale),
    ]),
  );
}

function NativePolicyContent({
  policy,
  locale,
}: {
  policy: PolicyPageSlug;
  locale: AppLocale;
}) {
  if (policy === "privacy_policy") {
    return <PrivacyPolicyContent locale={locale} />;
  }
  if (policy === "service_terms") {
    return <ServiceTermsContent locale={locale} />;
  }
  if (policy === "legal" || policy === "impressum") {
    return <LegalPolicyContent locale={locale} policy={policy} />;
  }
  return <PublicPolicyContent locale={locale} policy={policy} />;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/policy/[policy]">): Promise<Metadata> {
  const { locale, policy } = await params;
  if (!hasLocale(routing.locales, locale) || !isPolicyPageSlug(policy)) {
    return {};
  }

  const page = getPolicyPage(policy);
  const nativeCopy = getNativePolicyCopy(policy, locale);
  const canonical = localizedPolicyPath(policy, locale);

  return {
    title: nativeCopy.metadataTitle,
    description: nativeCopy.metadataDescription,
    alternates: {
      canonical,
      languages: {
        ...localizedPolicyAlternates(policy),
        "x-default": localizedPolicyPath(policy, routing.defaultLocale),
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: nativeCopy.metadataTitle,
      description: nativeCopy.metadataDescription,
      siteName: page.siteName,
    },
    twitter: {
      card: "summary",
      title: nativeCopy.metadataTitle,
      description: nativeCopy.metadataDescription,
    },
  };
}

export default async function PolicyPage({
  params,
}: PageProps<"/[locale]/policy/[policy]">) {
  const { locale, policy } = await params;
  if (!hasLocale(routing.locales, locale) || !isPolicyPageSlug(policy)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <>
      <TopAnchor />
      <main
        id="main-content"
        className={`site-content-page policy-legal ${layout.main}`}
        lang={locale}
      >
        <Container>
          <NativePolicyContent policy={policy} locale={locale} />
        </Container>
      </main>
    </>
  );
}
