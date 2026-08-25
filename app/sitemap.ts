import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import {
  canonicalPagePath,
  isNextCanonicalSlug,
  SEO_PAGE_SLUGS,
  seoSettings,
} from "@/lib/sitePageCatalog";

const SITE_URL = "https://bababou.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return SEO_PAGE_SLUGS.map((slug) => {
    const englishPath = canonicalPagePath(slug, "en");
    const frenchPath = canonicalPagePath(slug, "fr");
    const primaryPath = isNextCanonicalSlug(slug)
      ? canonicalPagePath(slug, routing.defaultLocale)
      : englishPath;
    const settings = seoSettings(slug);

    return {
      url: new URL(primaryPath, SITE_URL).href,
      changeFrequency: settings.changeFrequency,
      priority: settings.priority,
      alternates: {
        languages: {
          en: new URL(englishPath, SITE_URL).href,
          fr: new URL(frenchPath, SITE_URL).href,
        },
      },
    };
  });
}
