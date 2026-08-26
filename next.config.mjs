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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return migratedLegacyRedirects;
  },
  turbopack: {
    root: projectRoot,
  },
};

export default withNextIntl(nextConfig);
