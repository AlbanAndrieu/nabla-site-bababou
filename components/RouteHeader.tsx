"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";

import Container from "@/components/ui/Container";
import { type AppLocale, routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import styles from "./RouteHeader.module.css";

export const ROUTE_HEADER_LANGUAGE_SWITCHER_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_LOCALE_SWITCHER !== "false";

function routeParts(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (routing.locales.some((locale) => locale === parts[0])) parts.shift();
  return parts.map((part) => part.replace(/\.html$/, ""));
}

function localizedPath(locale: string, parts: string[]) {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = parts.length ? `/${parts.join("/")}` : "";
  return `${prefix}${suffix}` || "/";
}

function parentLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function RouteHeader() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("site");
  const pathname = usePathname();
  const router = useRouter();
  const parts = routeParts(pathname);
  const showNavigation = parts.length > 0;
  const showLanguageSwitcher = ROUTE_HEADER_LANGUAGE_SWITCHER_ENABLED;

  if (!showNavigation && !showLanguageSwitcher) return null;

  const parentParts = parts.slice(0, -1);
  const parentSegment = parentParts.at(-1);
  const homeHref = canonicalPagePath("index", locale);
  const parentHref = parentParts.length
    ? localizedPath(locale, parentParts)
    : null;

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    const hasHtmlSuffix = pathname.endsWith(".html");
    const targetParts = [...parts];
    if (hasHtmlSuffix && targetParts.length) {
      targetParts[targetParts.length - 1] += ".html";
    }
    router.replace(localizedPath(nextLocale, targetParts));
  }

  const headerClassName = showNavigation
    ? styles.header
    : `${styles.header} ${styles.root}`;

  return (
    <header className={headerClassName}>
      <Container className={styles.inner}>
        {showNavigation ? (
          <nav className={styles.nav} aria-label={t("breadcrumbLabel")}>
            <Link
              className={styles.home}
              href={homeHref}
              aria-label={t("home")}
            >
              <i className="fas fa-home" aria-hidden="true" />
              <span>{t("home")}</span>
            </Link>
            {parentHref && parentSegment ? (
              <>
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
                <Link className={styles.parent} href={parentHref}>
                  <i className="fas fa-arrow-left" aria-hidden="true" />
                  <span>{parentLabel(parentSegment)}</span>
                </Link>
              </>
            ) : null}
          </nav>
        ) : null}
        {showLanguageSwitcher ? (
          <label htmlFor="route-header-locale" className={styles.locale}>
            <span>{t("localeSwitcherLabel")}</span>
            <select
              id="route-header-locale"
              value={locale}
              onChange={handleLocaleChange}
              aria-label={t("switchLanguage")}
              className={styles.select}
            >
              {routing.locales.map((supportedLocale) => (
                <option key={supportedLocale} value={supportedLocale}>
                  {t(`languageName.${supportedLocale}`)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </Container>
    </header>
  );
}
