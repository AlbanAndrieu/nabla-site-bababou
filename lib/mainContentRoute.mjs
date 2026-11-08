/**
 * Shared public routes for Next redirects, SEO and keyboard navigation.
 * Dependency-free ESM. Legacy aliases and policy pages are NOT sitemap canonicals.
 */
export const NEXT_CANONICAL_SLUGS = Object.freeze([
  "contact",
  "central-authorities",
  "central-authorities-failures",
  "central-authorities-documents",
  "nre",
  "evidence-access",
  "email",
  "link",
  "success",
  "cancel",
]);

/** Historic HTML redirects use their original language-specific targets. */
export const LEGACY_HTML_REDIRECT_SLUGS = Object.freeze([
  "contact",
  "email",
  "link",
  "success",
  "cancel",
  "central-authorities",
  "central-authorities-failures",
]);

/** Must match keys of POLICY_PAGES, covered by the route registry contract. */
export const POLICY_ROUTE_SLUGS = Object.freeze([
  "accessibility_statement",
  "cookie_policy",
  "impressum",
  "legal",
  "privacy_policy",
  "service_terms",
]);

const MAIN_PAGES = new Set([
  ...NEXT_CANONICAL_SLUGS,
  "home-preview",
  "abduction",
  "test",
  "policy",
  "nre-en",
  "nre-fr",
]);
const POLICY_DETAILS = new Set(POLICY_ROUTE_SLUGS);

export function hasMainContentRoute(parts) {
  if (!Array.isArray(parts) || !parts.every((part) =>
    typeof part === "string" && /^[a-z0-9_-]+$/.test(part))) {
    return false;
  }
  if (parts.length === 1) return MAIN_PAGES.has(parts[0]);
  if (parts.length === 2) {
    if (parts[0] === "policy") return POLICY_DETAILS.has(parts[1]);
    return parts[0] === "ca" && parts[1] === "index";
  }
  return false;
}
