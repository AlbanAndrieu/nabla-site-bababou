import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "de", "no"],
  defaultLocale: "fr",
  localePrefix: "as-needed", // Pas de préfixe pour la defaultLocale (fr)
  localeDetection: true, // Autodétection navigateur
});

export type AppLocale = (typeof routing.locales)[number];
