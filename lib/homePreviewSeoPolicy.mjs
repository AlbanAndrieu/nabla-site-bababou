/**
 * Keep non-indexable React home reviews out of imported legacy sitemaps.
 * Decode repeated percent-encoding exactly as the analytics privacy guard
 * does. Never treat a malformed URL as a new publishable review alias.
 * @param {string} pathname
 * @returns {boolean}
 */
export function isHomePreviewPath(pathname) {
  if (typeof pathname !== "string") return false;
  const reviewRoute = /^\/(?:fr\/|en\/|de\/|no\/)?home-preview\/?$/i;
  let candidate = pathname;
  for (let i = 0; i < 3; i++) {
    if (reviewRoute.test(candidate)) return true;
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return false;
      candidate = decoded;
    } catch {
      return false;
    }
  }
  return reviewRoute.test(candidate);
}
