"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";

import { type AppLocale, routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("site");
  const pathname = usePathname();
  const router = useRouter();

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as AppLocale;
    // Shared routing (no `pathnames` map): `pathname` already reflects the active route.
    router.replace({ pathname }, { locale: nextLocale });
  }

  return (
    <label htmlFor="locale-switcher" className="locale-switcher">
      <span>{t("localeSwitcherLabel")}</span>
      <select
        id="locale-switcher"
        name="locale"
        value={locale}
        onChange={handleLocaleChange}
        className="form-select form-select-sm"
        aria-label={t("switchLanguage")}
      >
        {routing.locales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {t(`languageName.${supportedLocale}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
