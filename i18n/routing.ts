import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "de", "no"],
  defaultLocale: "fr",
  localePrefix: "as-needed", // Pas de préfixe pour la defaultLocale (fr)
  // Canonical unprefixed URLs are always French. Browser language must not
  // silently turn /contact, /policy or payment-result routes into English.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
