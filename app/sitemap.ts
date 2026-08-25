import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  SEO_PAGE_SLUGS,
  seoSettings,
} from "@/lib/sitePageCatalog";

const SITE_URL = "https://bababou.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return SEO_PAGE_SLUGS.map((slug) => {
    const primaryPath = canonicalPagePath(slug, routing.defaultLocale);
    const settings = seoSettings(slug);
    const languages = Object.fromEntries([
      ...routing.locales.map((locale) => [
        locale,
        new URL(canonicalPagePath(slug, locale), SITE_URL).href,
      ]),
      ["x-default", new URL(primaryPath, SITE_URL).href],
    ]);

    return {
      url: new URL(primaryPath, SITE_URL).href,
      changeFrequency: settings.changeFrequency,
      priority: settings.priority,
      alternates: { languages },
    };
  });
}
