/**
 * Keep non-indexable React home reviews out of imported legacy sitemaps.
 * The French default has both the canonical unprefixed path and an alias.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isHomePreviewPath(pathname) {
  // URL.pathname preserves percent-encoded characters. Decode once so a
  // legacy sitemap cannot republish a noindex route through an encoded alias.
  if (typeof pathname !== "string") return false;
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  return /^(?:\/(?:fr|en|de|no))?\/home-preview\/?$/.test(decoded);
}
