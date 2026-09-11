import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en", "de", "no"],
  defaultLocale: "fr",
  localePrefix: "as-needed", // Pas de préfixe pour la defaultLocale (fr)
  // Canonical unprefixed URLs are always French. Browser language must not
  // silently turn /contact, /policy or payment-result routes into English.
  localeDetection: false,
  // next-intl client navigation intentionally reads NEXT_LOCALE, so HttpOnly
  // is unsupported. Keep local HTTP development usable while requiring Secure
  // on deployed production/Preview builds.
  localeCookie: {
    secure: process.env.NODE_ENV === "production",
  },
});

export type AppLocale = (typeof routing.locales)[number];
