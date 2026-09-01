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
 * Remaining policy pages stay static sources during Migration 7, with clean and
 * localized entry points routed through Next/Vercel. Accessibility is excluded
 * because its clean route is now owned by the App Router while the reviewed
 * static document remains the source of its legal copy.
 */
const policyFiles = [
  "legal",
  "impressum",
  "privacy_policy",
  "service_terms",
  "cookie_policy",
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
