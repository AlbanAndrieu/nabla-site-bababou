import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";
import { isHomeCutoverEnabled } from "./lib/homeCutoverPolicy.mjs";
import { LEGACY_HTML_REDIRECT_SLUGS, POLICY_ROUTE_SLUGS } from "./lib/mainContentRoute.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const migratedLegacyRedirects = LEGACY_HTML_REDIRECT_SLUGS.flatMap((slug) => [
  // Legacy root pages were English before the Next locale policy changed.
  { source: `/${slug}.html`, destination: `/en/${slug}`, permanent: true },
  // Legacy French pages lived below /fr; French is now the unprefixed default.
  { source: `/fr/${slug}.html`, destination: `/${slug}`, permanent: true },
]);

const migratedNreRedirects = [
  { source: "/nre-fr.html", destination: "/nre", permanent: true },
  { source: "/nre-en.html", destination: "/en/nre", permanent: true },
];

const migratedCentralAuthorityDocumentHubRedirects = [
  {
    source: "/ca",
    destination: "/en/central-authorities-documents",
    permanent: true,
  },
  {
    source: "/ca/index.html",
    destination: "/en/central-authorities-documents",
    permanent: true,
  },
];

/**
 * Policy HTML files stay in public/ as reviewed filesystem sources for the
 * native policy registry, but their public legacy URLs now converge on the
 * extensionless App Router canonicals.
 */
const migratedPolicyRedirects = POLICY_ROUTE_SLUGS.map((slug) => ({
  source: `/policy/${slug}.html`,
  destination: `/policy/${slug}`,
  permanent: true,
}));

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    globalNotFound: true,
  },
  outputFileTracingIncludes: {
    "/__legacy-html-not-found__": ["./public/404.html"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Keep the old physical HTML for rollback, but exclude the duplicate
      // /index.html URL from search only once the SHA-approved React home ships.
      // This decision is evaluated at build time; env changes require redeploy.
      ...(isHomeCutoverEnabled() ? [{
        source: "/index.html",
        headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
      }] : []),
      // The review page can be opened by a human but must not be indexed.
      ...["home-preview", "abduction", "for-fathers", "abduction-norway", "abduction-germany"]
        .flatMap((slug) => ["/" + slug, "/:locale/" + slug]).map((source) => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, nosnippet" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      })),
    ];
  },
  async redirects() {
    return [
      ...migratedLegacyRedirects,
      ...migratedNreRedirects,
      ...migratedCentralAuthorityDocumentHubRedirects,
      ...migratedPolicyRedirects,
    ];
  },
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
