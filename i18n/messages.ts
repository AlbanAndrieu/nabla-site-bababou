import type { AppLocale } from "@/i18n/routing";

const BASE_LOADERS = {
  fr: () => import("@/messages/fr.json"),
  en: () => import("@/messages/en.json"),
} as const;

const CONTACT_LOADERS = {
  fr: () => import("@/messages/contact/fr.json"),
  en: () => import("@/messages/contact/en.json"),
} as const;

const EMAIL_LOADERS = {
  fr: () => import("@/messages/email/fr.json"),
  en: () => import("@/messages/email/en.json"),
} as const;

const LINK_LOADERS = {
  fr: () => import("@/messages/link/fr.json"),
  en: () => import("@/messages/link/en.json"),
} as const;

// The hybrid Next runtime only needs shared chrome from the legacy base
// catalogs. Page-specific namespaces are owned by focused domain catalogs.
// Keeping this allowlist narrow also prevents unused portfolio copy inherited
// from the reference site from being serialized through NextIntlClientProvider.
const BASE_RUNTIME_NAMESPACES = new Set(["site"]);

function selectRuntimeBaseNamespaces<T extends Record<string, unknown>>(catalog: T) {
  return Object.fromEntries(
    Object.entries(catalog).filter(([namespace]) =>
      BASE_RUNTIME_NAMESPACES.has(namespace),
    ),
  );
}

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
    { default: base },
    { default: contact },
    { default: email },
    { default: link },
  ] = await Promise.all([
    BASE_LOADERS[locale](),
    CONTACT_LOADERS[locale](),
    EMAIL_LOADERS[locale](),
    LINK_LOADERS[locale](),
  ]);

  const runtimeBase = selectRuntimeBaseNamespaces(base);
  const catalogs = [runtimeBase, contact, email, link];
  assertUniqueTopLevelNamespaces(catalogs);

  return Object.assign({}, ...catalogs);
}
