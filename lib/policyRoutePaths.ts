import { type AppLocale, routing } from "@/i18n/routing";
import { getPolicyPage, type PolicyPageSlug } from "@/lib/policyPages";

/** Canonical policy index: French has no locale prefix. */
export function localizedPolicyIndexPath(locale: AppLocale) {
  return locale === routing.defaultLocale ? "/policy" : `/${locale}/policy`;
}

/** The archived .html files are not the canonical policy URLs. */
export function localizedPolicyPath(policy: PolicyPageSlug, locale: AppLocale) {
  const base = getPolicyPage(policy).canonicalPath;
  return locale === routing.defaultLocale ? base : `/${locale}${base}`;
}
