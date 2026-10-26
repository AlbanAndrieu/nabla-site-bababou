/**
 * Keep non-indexable React home reviews out of imported legacy sitemaps.
 * The French default has both the canonical unprefixed path and an alias.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isHomePreviewPath(pathname) {
  return /^(?:\/(?:fr|en|de|no))?\/home-preview\/?$/.test(pathname);
}
