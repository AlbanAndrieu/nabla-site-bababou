import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const migratedLegacyRedirects = [
  "contact",
  "email",
  "link",
  "success",
  "cancel",
  "central-authorities",
  "central-authorities-failures",
].flatMap((slug) => [
  // Legacy root pages were English before the Next locale policy changed.
  { source: `/${slug}.html`, destination: `/en/${slug}`, permanent: true },
  // Legacy French pages lived below /fr; French is now the unprefixed default.
  { source: `/fr/${slug}.html`, destination: `/${slug}`, permanent: true },
]);

const migratedNreRedirects = [
  { source: "/nre-fr.html", destination: "/nre", permanent: true },
  { source: "/nre-en.html", destination: "/en/nre", permanent: true },
];

/**
 * Policy HTML files stay in public/ as reviewed filesystem sources for the
 * native policy registry, but their public legacy URLs now converge on the
 * extensionless App Router canonicals.
 */
const migratedPolicyRedirects = [
  "accessibility_statement",
  "cookie_policy",
  "impressum",
  "legal",
  "privacy_policy",
  "service_terms",
].map((slug) => ({
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      ...migratedLegacyRedirects,
      ...migratedNreRedirects,
      ...migratedPolicyRedirects,
    ];
  },
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
