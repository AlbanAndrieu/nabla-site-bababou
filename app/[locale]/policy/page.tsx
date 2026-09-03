import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
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
        className="site-content-page container py-4"
        lang={locale}
      >
        <header className="mb-4">
          <h1>{copy.heading}</h1>
          <p className="lead mb-0">{copy.intro}</p>
        </header>

        <div className="row g-3">
          {POLICY_PAGE_SLUGS.map((policy) => {
            const policyCopy = getNativePolicyCopy(policy, locale);
            const href = localizedPolicyPath(policy, locale);

            return (
              <div className="col-12 col-md-6" key={policy}>
                <article className="card h-100 shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <h2 className="h4 card-title">{policyCopy.title}</h2>
                    <p className="card-text flex-grow-1">
                      {policyCopy.metadataDescription}
                    </p>
                    <a className="btn btn-outline-primary align-self-start" href={href}>
                      {copy.open}
                    </a>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
