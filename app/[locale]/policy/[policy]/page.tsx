import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import PrivacyPolicyContent from "@/components/policy/PrivacyPolicyContent";
import ServiceTermsContent from "@/components/policy/ServiceTermsContent";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  getPolicyPage,
  isNativeLocalizedPolicySlug,
  isPolicyPageSlug,
  POLICY_PAGE_SLUGS,
  type PolicyPageSlug,
} from "@/lib/policyPages";
import { getPrivacyPolicyCopy } from "@/lib/privacyPolicy";
import { getServiceTermsCopy } from "@/lib/serviceTerms";

export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    POLICY_PAGE_SLUGS.map((policy) => ({ locale, policy })),
  );
}

function localizedPolicyPath(policy: PolicyPageSlug, locale: AppLocale) {
  const basePath = getPolicyPage(policy).canonicalPath;
  return locale === routing.defaultLocale ? basePath : `/${locale}${basePath}`;
}

function localizedPolicyAlternates(policy: PolicyPageSlug) {
  return Object.fromEntries(
    routing.locales.map((locale) => [
      locale,
      localizedPolicyPath(policy, locale),
    ]),
  );
}

function getNativePolicyCopy(policy: PolicyPageSlug, locale: AppLocale) {
  if (policy === "privacy_policy") {
    return getPrivacyPolicyCopy(locale);
  }
  if (policy === "service_terms") {
    return getServiceTermsCopy(locale);
  }
  return null;
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
  if (nativeCopy) {
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

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: page.canonicalPath,
    },
    openGraph: {
      type: "website",
      url: page.canonicalPath,
      title: page.title,
      description: page.socialDescription,
      siteName: page.siteName,
    },
    twitter: {
      card: "summary",
      title: page.title,
      description: page.socialDescription,
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
  const page = getPolicyPage(policy);
  const nativePolicy = isNativeLocalizedPolicySlug(policy);

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main
        id="main-content"
        className="site-content-page policy-legal container py-4"
        lang={nativePolicy ? locale : page.contentLanguage}
      >
        {policy === "privacy_policy" ? (
          <PrivacyPolicyContent locale={locale} />
        ) : policy === "service_terms" ? (
          <ServiceTermsContent locale={locale} />
        ) : (
          <PublicHtmlFragment
            file={page.sourceFile}
            mode="main"
            locale={locale}
          />
        )}
      </main>
    </>
  );
}
