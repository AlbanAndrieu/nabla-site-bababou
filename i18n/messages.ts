import type { AppLocale } from "@/i18n/routing";

type CatalogLoader = () => Promise<unknown>;

const SITE_LOADERS = {
  fr: () => import("@/messages/site/fr.json"),
  en: () => import("@/messages/site/en.json"),
  de: () => import("@/messages/site/de.json"),
  no: () => import("@/messages/site/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const HOMEPAGE_PREVIEW_LOADERS = {
  fr: () => import("@/messages/homepage-preview/fr.json"),
  en: () => import("@/messages/homepage-preview/en.json"),
  de: () => import("@/messages/homepage-preview/de.json"),
  no: () => import("@/messages/homepage-preview/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const POLICY_INDEX_LOADERS = {
  fr: () => import("@/messages/policy-index/fr.json"),
  en: () => import("@/messages/policy-index/en.json"),
  de: () => import("@/messages/policy-index/de.json"),
  no: () => import("@/messages/policy-index/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const CONTACT_LOADERS = {
  fr: () => import("@/messages/contact/fr.json"),
  en: () => import("@/messages/contact/en.json"),
  de: () => import("@/messages/contact/de.json"),
  no: () => import("@/messages/contact/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const CENTRAL_AUTHORITIES_LOADERS = {
  fr: () => import("@/messages/central-authorities/fr.json"),
  en: () => import("@/messages/central-authorities/en.json"),
  de: () => import("@/messages/central-authorities/de.json"),
  no: () => import("@/messages/central-authorities/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const CENTRAL_AUTHORITIES_FAILURES_LOADERS = {
  fr: () => import("@/messages/central-authorities-failures/fr.json"),
  en: () => import("@/messages/central-authorities-failures/en.json"),
  de: () => import("@/messages/central-authorities-failures/de.json"),
  no: () => import("@/messages/central-authorities-failures/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const CENTRAL_AUTHORITY_DOCUMENTS_LOADERS = {
  fr: () => import("@/messages/central-authorities-documents/fr.json"),
  en: () => import("@/messages/central-authorities-documents/en.json"),
  de: () => import("@/messages/central-authorities-documents/de.json"),
  no: () => import("@/messages/central-authorities-documents/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const NRE_LOADERS = {
  fr: () => import("@/messages/nre/fr.json"),
  en: () => import("@/messages/nre/en.json"),
  de: () => import("@/messages/nre/de.json"),
  no: () => import("@/messages/nre/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const EMAIL_LOADERS = {
  fr: () => import("@/messages/email/fr.json"),
  en: () => import("@/messages/email/en.json"),
  de: () => import("@/messages/email/de.json"),
  no: () => import("@/messages/email/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const LINK_LOADERS = {
  fr: () => import("@/messages/link/fr.json"),
  en: () => import("@/messages/link/en.json"),
  de: () => import("@/messages/link/de.json"),
  no: () => import("@/messages/link/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const CHECKOUT_LOADERS = {
  fr: () => import("@/messages/checkout/fr.json"),
  en: () => import("@/messages/checkout/en.json"),
  de: () => import("@/messages/checkout/de.json"),
  no: () => import("@/messages/checkout/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const TEST_LOADERS = {
  fr: () => import("@/messages/test/fr.json"),
  en: () => import("@/messages/test/en.json"),
  de: () => import("@/messages/test/de.json"),
  no: () => import("@/messages/test/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

function assertUniqueTopLevelNamespaces(
  catalogs: ReadonlyArray<Record<string, unknown>>,
) {
  const owners = new Map<string, number>();

  catalogs.forEach((catalog, catalogIndex) => {
    for (const namespace of Object.keys(catalog)) {
      const previousOwner = owners.get(namespace);
      if (previousOwner !== undefined) {
        throw new Error(
          `Duplicate i18n namespace "${namespace}" in catalogs ${previousOwner} and ${catalogIndex}`,
        );
      }
      owners.set(namespace, catalogIndex);
    }
  });
}

export async function loadMessages(locale: AppLocale) {
  const [
    { default: site },
    { default: homepagePreview },
    { default: policyIndex },
    { default: contact },
    { default: centralAuthorities },
    { default: centralAuthoritiesFailures },
    { default: centralAuthorityDocuments },
    { default: nre },
    { default: email },
    { default: link },
    { default: checkout },
    { default: testSurface },
  ] = await Promise.all([
    SITE_LOADERS[locale](),
    HOMEPAGE_PREVIEW_LOADERS[locale](),
    POLICY_INDEX_LOADERS[locale](),
    CONTACT_LOADERS[locale](),
    CENTRAL_AUTHORITIES_LOADERS[locale](),
    CENTRAL_AUTHORITIES_FAILURES_LOADERS[locale](),
    CENTRAL_AUTHORITY_DOCUMENTS_LOADERS[locale](),
    NRE_LOADERS[locale](),
    EMAIL_LOADERS[locale](),
    LINK_LOADERS[locale](),
    CHECKOUT_LOADERS[locale](),
    TEST_LOADERS[locale](),
  ]);

  const catalogs = [
    site,
    homepagePreview,
    policyIndex,
    contact,
    centralAuthorities,
    centralAuthoritiesFailures,
    centralAuthorityDocuments,
    nre,
    email,
    link,
    checkout,
    testSurface,
  ];
  assertUniqueTopLevelNamespaces(catalogs);

  return Object.assign({}, ...catalogs);
}
