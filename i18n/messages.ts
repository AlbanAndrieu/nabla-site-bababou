import type { AppLocale } from "@/i18n/routing";

type CatalogLoader = () => Promise<unknown>;

const SITE_LOADERS = {
  fr: () => import("@/messages/site/fr.json"),
  en: () => import("@/messages/site/en.json"),
  de: () => import("@/messages/site/de.json"),
  no: () => import("@/messages/site/no.json"),
} as const satisfies Record<AppLocale, CatalogLoader>;

const CONTACT_LOADERS = {
  fr: () => import("@/messages/contact/fr.json"),
  en: () => import("@/messages/contact/en.json"),
  de: () => import("@/messages/contact/de.json"),
  no: () => import("@/messages/contact/no.json"),
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
    { default: contact },
    { default: email },
    { default: link },
  ] = await Promise.all([
    SITE_LOADERS[locale](),
    CONTACT_LOADERS[locale](),
    EMAIL_LOADERS[locale](),
    LINK_LOADERS[locale](),
  ]);

  const catalogs = [site, contact, email, link];
  assertUniqueTopLevelNamespaces(catalogs);

  return Object.assign({}, ...catalogs);
}
