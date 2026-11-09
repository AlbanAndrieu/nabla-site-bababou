import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { POLICY_ROUTE_SLUGS } from "../lib/mainContentRoute.mjs";

// Locale set mirrors i18n/routing.ts. Source flags alone cannot prove SSG.
export const STATIC_LOCALES = Object.freeze(["fr", "en", "de", "no"]);
export const STATIC_SLUGS = Object.freeze([
  "nre",
  "central-authorities",
  "central-authorities-documents",
  "central-authorities-failures",
  "home-preview",
  "success",
  ...POLICY_ROUTE_SLUGS.map((policy) => "policy/" + policy),
]);

export function auditPrerenderManifest(manifest, options = {}) {
  if (!manifest || typeof manifest.routes !== "object" || !manifest.routes) {
    throw new Error("Expected a valid Next.js prerender-manifest with routes");
  }

  const locales = options.locales ?? STATIC_LOCALES;
  const slugs = options.slugs ?? STATIC_SLUGS;
  const missing = [];
  const notStatic = [];
  const checked = [];
  for (const locale of locales) {
    for (const slug of slugs) {
      // next-intl "as-needed" may represent French as /fr or unprefixed.
      const choices = locale === "fr"
        ? ["/" + slug, "/fr/" + slug]
        : ["/" + locale + "/" + slug];
      const key = choices.find((route) =>
        Object.prototype.hasOwnProperty.call(manifest.routes, route));
      if (!key) {
        missing.push(locale + ":" + slug);
        continue;
      }
      // false identifies build-time prerender; ISR/dynamic needs review.
      if (manifest.routes[key].initialRevalidateSeconds !== false) {
        notStatic.push(key);
      }
      checked.push(key);
    }
  }
  return {
    checked,
    missing,
    notStatic,
    passed: missing.length === 0 && notStatic.length === 0,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const input = resolve(process.argv[2] ?? ".next/prerender-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(input, "utf8"));
  } catch {
    console.error("SSG_NOT_VERIFIED: Next.js prerender manifest missing or invalid; run npm run build first.");
    process.exitCode = 2;
  }

  if (manifest) {
    const result = auditPrerenderManifest(manifest);
    if (!result.passed) {
      console.error("SSG_FAIL: missing=" + (result.missing.join(",") || "none") +
        " notStatic=" + (result.notStatic.join(",") || "none"));
      process.exitCode = 1;
    } else {
      console.log("SSG_PASS: " + result.checked.length +
        " localized legal/NRE/review pages are build-time prerendered.");
    }
  }
}
