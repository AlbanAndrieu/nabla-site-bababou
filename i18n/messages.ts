import type { AppLocale } from "@/i18n/routing";

const BASE_LOADERS = {
  fr: () => import("@/messages/fr.json"),
  en: () => import("@/messages/en.json"),
} as const;

const CONTACT_LOADERS = {
  fr: () => import("@/messages/contact/fr.json"),
  en: () => import("@/messages/contact/en.json"),
} as const;

const MIGRATED_BASE_NAMESPACES = new Set(["contactPage"]);

function withoutMigratedNamespaces<T extends Record<string, unknown>>(catalog: T) {
  const filtered = { ...catalog } as Record<string, unknown>;
  for (const namespace of MIGRATED_BASE_NAMESPACES) {
    delete filtered[namespace];
  }
  return filtered;
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
  const [{ default: base }, { default: contact }] = await Promise.all([
    BASE_LOADERS[locale](),
    CONTACT_LOADERS[locale](),
  ]);

  const legacyBase = withoutMigratedNamespaces(base);
  assertUniqueTopLevelNamespaces([legacyBase, contact]);

  return {
    ...legacyBase,
    ...contact,
  };
}
