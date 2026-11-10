import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isHomeCutoverEnabled } from "../lib/homeCutoverPolicy.mjs";

export const HOME_LOCALES = Object.freeze(["fr", "en", "de", "no"]);

/**
 * Static build + release authorization must agree. A successful check here
 * does not replace a browser, accessibility, privacy or security release gate.
 */
export function auditHomepageCutover(manifest, env = {}) {
  if (!isHomeCutoverEnabled(env)) {
    return { passed: false, status: "APPROVAL_INCOMPLETE", checked: [], missing: [], notStatic: [] };
  }
  if (!manifest || typeof manifest.routes !== "object" || !manifest.routes) {
    return { passed: false, status: "MANIFEST_MISSING", checked: [], missing: [], notStatic: [] };
  }

  const missing = [];
  const notStatic = [];
  const checked = [];
  for (const locale of HOME_LOCALES) {
    const candidates = locale === "fr" ? ["/", "/fr"] : [`/${locale}`];
    const matched = candidates.find(route =>
      Object.prototype.hasOwnProperty.call(manifest.routes, route));
    if (!matched) {
      missing.push(locale);
      continue;
    }
    checked.push(matched);
    const route = manifest.routes[matched];
    if (!route || typeof route !== "object" ||
        route.initialRevalidateSeconds !== false) {
      notStatic.push(matched);
    }
  }
  return {
    passed: missing.length === 0 && notStatic.length === 0,
    status: missing.length || notStatic.length ? "SSG_NOT_VERIFIED" : "STATIC_BUILD_VERIFIED",
    checked, missing, notStatic,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = resolve(process.argv[2] ?? ".next/prerender-manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    manifest = null;
  }
  const result = auditHomepageCutover(manifest, process.env);
  if (!result.passed) {
    console.error(`HOME_CUTOVER_NO_GO status=${result.status} missing=${result.missing.join(",") || "none"} dynamic=${result.notStatic.join(",") || "none"}`);
    process.exitCode = 1;
  } else {
    console.log(`HOME_CUTOVER_STATIC_OK locales=${HOME_LOCALES.length} routes=${result.checked.join(",")} SHA-bound; browser/security checks still required`);
  }
}
