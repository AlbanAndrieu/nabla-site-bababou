import { type AppLocale, routing } from "@/i18n/routing";
import { getLegalPolicyCopy } from "@/lib/legalPolicies";
import { getPolicyPage, type PolicyPageSlug } from "@/lib/policyPages";
import { getPrivacyPolicyCopy } from "@/lib/privacyPolicy";
import { getPublicPolicyCopy } from "@/lib/publicPolicies";
import { getServiceTermsCopy } from "@/lib/serviceTerms";

/** All native policy cards, metadata and route links share one provider. */
export function getNativePolicyCopy(policy: PolicyPageSlug, locale: AppLocale) {
  if (policy === "privacy_policy") return getPrivacyPolicyCopy(locale);
  if (policy === "service_terms") return getServiceTermsCopy(locale);
  if (policy === "legal" || policy === "impressum") {
    return getLegalPolicyCopy(policy, locale);
  }
  return getPublicPolicyCopy(policy, locale);
}

/**
 * The legacy policy files remain in public/ but their public canonicals
 * are the extensionless Next routes. French remains the default locale.
 */
export function localizedPolicyPath(policy: PolicyPageSlug, locale: AppLocale) {
  const base = getPolicyPage(policy).canonicalPath;
  return locale === routing.defaultLocale ? base : `/${locale}${base}`;
}
