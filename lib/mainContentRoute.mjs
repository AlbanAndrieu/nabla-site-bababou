/** Routes that render a real #main-content landmark in the Next.js locale layout.
 * Other routes (including unknown and redirect-only paths) do not get a dangling skip link.
 * routeParts() strips the locale prefix and a final .html suffix before calling this helper.
 */
const MAIN_PAGES = new Set([
  "home-preview",
  "contact",
  "central-authorities",
  "central-authorities-documents",
  "central-authorities-failures",
  "nre",
  "nre-en",
  "nre-fr",
  "email",
  "link",
  "cancel",
  "success",
  "test",
  "policy",
]);

const POLICY_DETAILS = new Set([
  "accessibility_statement",
  "cookie_policy",
  "impressum",
  "legal",
  "privacy_policy",
  "service_terms",
]);

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
