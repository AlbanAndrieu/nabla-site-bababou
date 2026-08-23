import path from "node:path";
import { fileURLToPath } from "node:url";

import createNextIntlPlugin from "next-intl/plugin";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },

  /*
   * Temporary migration fallback:
   *
   * Vercel now deploys this repository as a Next.js application, but the
   * legacy homepage still lives in public/index.html while the App Router
   * migration is completed incrementally. Rewriting only the root URL keeps
   * the existing public site functional without giving up Next.js for routes
   * that have already been migrated.
   *
   * Remove this rewrite once app/[locale]/page.tsx is production-ready and
   * the legacy homepage can be retired.
   */
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html",
      },
    ];
  },
};

export default withNextIntl(nextConfig);
