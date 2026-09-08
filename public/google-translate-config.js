/**
 * Google Translate legacy compatibility shim.
 *
 * The supported runtime is /site-google-translate.js. Keep this file so older
 * cached/static pages that still reference google-translate-config.js continue
 * to get the fallback without owning a second Google loader implementation.
 */
(() => {
  if (window.__NABLA_GOOGLE_TRANSLATE_STARTED) return;

  const existing = document.querySelector(
    'script[src*="site-google-translate.js"]',
  );
  if (existing) return;

  const script = document.createElement("script");
  script.src = "/site-google-translate.js";
  script.defer = true;
  (document.head || document.documentElement).appendChild(script);
})();
