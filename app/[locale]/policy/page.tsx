import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import surface from "@/components/ui/Surface.module.css";
import { type AppLocale, routing } from "@/i18n/routing";
import { getLegalPolicyCopy } from "@/lib/legalPolicies";
import {
  getPolicyPage,
  POLICY_PAGE_SLUGS,
  type PolicyPageSlug,
} from "@/lib/policyPages";
import { getPrivacyPolicyCopy } from "@/lib/privacyPolicy";
import { getPublicPolicyCopy } from "@/lib/publicPolicies";
import { getServiceTermsCopy } from "@/lib/serviceTerms";

const POLICY_INDEX_COPY = {
  fr: {
    metadataTitle: "Politiques et informations légales | Bababou",
    metadataDescription:
      "Consultez les politiques, mentions légales, conditions d’utilisation, règles de confidentialité, cookies et accessibilité de bababou.com.",
    heading: "Politiques et informations légales",
    intro:
      "Retrouvez ici l’ensemble des politiques et informations légales applicables à bababou.com.",
    open: "Consulter",
  },
  en: {
    metadataTitle: "Policies and legal information | Bababou",
    metadataDescription:
      "Review the policies, legal notices, terms of service, privacy, cookies and accessibility information for bababou.com.",
    heading: "Policies and legal information",
    intro:
      "Find all policies and legal information applicable to bababou.com in one place.",
    open: "View policy",
  },
  de: {
    metadataTitle: "Richtlinien und rechtliche Informationen | Bababou",
    metadataDescription:
      "Lesen Sie die Richtlinien, rechtlichen Hinweise, Nutzungsbedingungen sowie Datenschutz-, Cookie- und Barrierefreiheitsinformationen von bababou.com.",
    heading: "Richtlinien und rechtliche Informationen",
    intro:
      "Hier finden Sie alle für bababou.com geltenden Richtlinien und rechtlichen Informationen.",
    open: "Richtlinie öffnen",
  },
  no: {
    metadataTitle: "Retningslinjer og juridisk informasjon | Bababou",
    metadataDescription:
      "Se retningslinjer, juridiske merknader, bruksvilkår samt informasjon om personvern, informasjonskapsler og tilgjengelighet for bababou.com.",
    heading: "Retningslinjer og juridisk informasjon",
    intro:
      "Her finner du alle retningslinjer og juridisk informasjon som gjelder for bababou.com.",
    open: "Åpne retningslinjen",
  },
} as const satisfies Record<
  AppLocale,
  Readonly<{
    metadataTitle: string;
    metadataDescription: string;
    heading: string;
    intro: string;
    open: string;
  }>
>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function localizedPolicyIndexPath(locale: AppLocale) {
  return locale === routing.defaultLocale ? "/policy" : `/${locale}/policy`;
}

function localizedPolicyPath(policy: PolicyPageSlug, locale: AppLocale) {
  const basePath = getPolicyPage(policy).canonicalPath;
  return locale === routing.defaultLocale ? basePath : `/${locale}${basePath}`;
}

function getNativePolicyCopy(policy: PolicyPageSlug, locale: AppLocale) {
  if (policy === "privacy_policy") return getPrivacyPolicyCopy(locale);
  if (policy === "service_terms") return getServiceTermsCopy(locale);
  if (policy === "legal" || policy === "impressum") {
    return getLegalPolicyCopy(policy, locale);
  }
  return getPublicPolicyCopy(policy, locale);
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/policy">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const copy = POLICY_INDEX_COPY[locale];
  const canonical = localizedPolicyIndexPath(locale);
  const languages = Object.fromEntries(
    routing.locales.map((alternateLocale) => [
      alternateLocale,
      localizedPolicyIndexPath(alternateLocale),
    ]),
  );

  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
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
      title: copy.metadataTitle,
      description: copy.metadataDescription,
      siteName: "Bababou",
    },
    twitter: {
      card: "summary",
      title: copy.metadataTitle,
      description: copy.metadataDescription,
    },
  };
}

export default async function PolicyIndexPage({
  params,
}: PageProps<"/[locale]/policy">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const copy = POLICY_INDEX_COPY[locale];

  return (
    <>
      <TopAnchor />
      <SkipToMainContent />
      <main
        id="main-content"
        className={`site-content-page ${layout.main}`}
        lang={locale}
      >
        <Container>
          <header className={layout.centeredHeader}>
            <h1 className={layout.title}>{copy.heading}</h1>
            <p className={layout.lead}>{copy.intro}</p>
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
                    {copy.open}
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
