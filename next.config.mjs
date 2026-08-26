import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const migratedLegacyRedirects = ["contact", "email", "link"].flatMap(
  (slug) => [
    // Legacy root pages were English before the Next locale policy changed.
    { source: `/${slug}.html`, destination: `/en/${slug}`, permanent: true },
    // Legacy French pages lived below /fr; French is now the unprefixed default.
    { source: `/fr/${slug}.html`, destination: `/${slug}`, permanent: true },
  ],
);

/**
 * Policy pages remain static sources during Migration 6, but clean and localized
 * entry points are now routed through the Next/Vercel runtime. This deliberately
 * avoids copying legal text into React before content/parity review.
 */
const policyFiles = [
  "legal",
  "impressum",
  "privacy_policy",
  "service_terms",
  "cookie_policy",
  "accessibility_statement",
];
const policyLocales = ["fr", "en"];
const policyRewrites = policyFiles.map((name) => ({
  source: `/policy/${name}`,
  destination: `/policy/${name}.html`,
}));
const localizedPolicyRewrites = policyLocales.flatMap((locale) =>
  policyRewrites.map(({ source, destination }) => ({
    source: `/${locale}${source}`,
    destination,
  })),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return migratedLegacyRedirects;
  },
  async rewrites() {
    return {
      afterFiles: [...localizedPolicyRewrites, ...policyRewrites],
    };
  },
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
