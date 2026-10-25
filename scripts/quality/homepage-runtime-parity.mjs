import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/** All scripts on the approved public homepage. No tracking IDs or secrets. */
export const LEGACY_SCRIPTS = Object.freeze([
  { src: "/assets/fontawesome-free-7.1.0-web/js/fontawesome.js", feature: "icons", state: "partial" },
  { src: "/assets/fontawesome-free-7.1.0-web/js/solid.js", feature: "icons", state: "partial" },
  { src: "/assets/fontawesome-free-7.1.0-web/js/brands.js", feature: "icons", state: "partial" },
  { src: "obs-connection.js", feature: "connection", state: "pending" },
  { src: "https://challenges.cloudflare.com/turnstile/v0/api.js", feature: "turnstile", state: "pending" },
  { src: "theme-toggle.js", feature: "theme", state: "partial" },
  { src: "/site-google-translate.js", feature: "translation", state: "pending" },
  { src: "/site-analytics.js", feature: "analytics", state: "partial" },
  { src: "d3.v3.min.js", feature: "d3", state: "pending" },
  { src: "arf.js", feature: "arf", state: "pending" },
  { src: "https://code.jquery.com/jquery-3.3.1.slim.min.js", feature: "jquery", state: "pending" },
  { src: "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js", feature: "popper", state: "pending" },
  { src: "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js", feature: "bootstrap", state: "pending" },
  { src: "https://uptime.betterstack.com/widgets/announcement.js", feature: "status-widget", state: "pending" },
  { src: "/site-widgets.js", feature: "site-widgets", state: "partial" },
]);

export function scriptSources(html) {
  return [...html.matchAll(/<script\b([^>]*)>/gi)]
    .map(([, attributes]) => /(?:^|\s)src\s*=\s*(["'])(.*?)\1/i.exec(attributes)?.[2])
    .filter((value) => typeof value === "string");
}

export function auditRuntimeParity({ legacyHtml, previewPage, localeLayout, proxy }) {
  const actual = scriptSources(legacyHtml);
  const expected = LEGACY_SCRIPTS.map(({ src }) => src);
  const missing = expected.filter((src) => !actual.includes(src));
  const unexpected = actual.filter((src) => !expected.includes(src));
  const duplicates = actual.filter((src, i) => actual.indexOf(src) !== i);
  const gates = {
    legacyHomepage: proxy.includes('NextResponse.rewrite(new URL("/index.html"'),
    previewReviewAvailable: !previewPage.includes("HOMEPAGE_PREVIEW_ENABLED") && previewPage.includes("export default async function HomePreview"),
    previewNoIndex: previewPage.includes('robots: { index: false, follow: false }'),
    sharedAnalytics: localeLayout.includes('src="/site-analytics.js"'),
    noLegacyScriptsInPreview: !/<script\b/i.test(previewPage) && !/<Script\b/.test(previewPage),
  };
  return {
    missing, unexpected, duplicates, gates,
    ready: missing.length === 0 && unexpected.length === 0 && duplicates.length === 0 && Object.values(gates).every(Boolean),
    pending: LEGACY_SCRIPTS.filter(({ state }) => state === "pending").map(({ feature }) => feature),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const result = auditRuntimeParity({
    legacyHtml: read("public/index.html"),
    previewPage: read("app/[locale]/home-preview/page.tsx"),
    localeLayout: read("app/[locale]/layout.tsx"),
    proxy: read("proxy.ts"),
  });
  console.log("Homepage runtime inventory: " + LEGACY_SCRIPTS.length + " legacy scripts; " + result.pending.length + " features still pending; " + (result.ready ? "source contract OK" : "SOURCE DRIFT"));
  if (!result.ready) {
    console.error(JSON.stringify({ missing: result.missing, unexpected: result.unexpected, duplicates: result.duplicates, gates: result.gates }, null, 2));
    process.exitCode = 1;
  }
  // An intact inventory is NOT a claim that the React preview has feature parity.
}
