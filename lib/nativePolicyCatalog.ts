import type { AppLocale } from "@/i18n/routing";
import { getLegalPolicyCopy } from "@/lib/legalPolicies";
import type { PolicyPageSlug } from "@/lib/policyPages";
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

// Preserve the public import while letting sitemap use only lightweight URL helpers.
export { localizedPolicyPath } from "@/lib/policyRoutePaths";
