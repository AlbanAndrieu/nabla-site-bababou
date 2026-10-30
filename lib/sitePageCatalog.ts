import { type AppLocale, routing } from "@/i18n/routing";
import { NEXT_CANONICAL_SLUGS } from "@/lib/mainContentRoute.mjs";

export type PageCategory =
  | "primaryVisibility"
  | "discoverability"
  | "technicalFlow";

type SeoSettings = {
  priority: number;
  changeFrequency: "weekly" | "monthly";
};

type SitePageDefinition = {
  category: PageCategory;
  seo?: SeoSettings;
};

/**
 * Single source of truth for the purpose and indexability of public pages.
 * Object order defines sitemap order: strongest visibility pages come first.
 *
 * During the hybrid migration, only routes that actually exist as stable
 * localized Next surfaces are indexable here. The homepage remains legacy-only
 * at `/` until P3 is complete; `/en` and `/fr` must not be advertised as
 * localized homepages while they are only App Router implementation routes.
 */
export const SITE_PAGES = {
  index: { category: "primaryVisibility" },
  contact: {
    category: "primaryVisibility",
    seo: { priority: 0.9, changeFrequency: "monthly" },
  },
  "central-authorities": {
    category: "discoverability",
    seo: { priority: 0.8, changeFrequency: "monthly" },
  },
  "central-authorities-failures": {
    category: "discoverability",
    seo: { priority: 0.75, changeFrequency: "monthly" },
  },
  "central-authorities-documents": {
    category: "discoverability",
    seo: { priority: 0.7, changeFrequency: "monthly" },
  },
  nre: {
    category: "discoverability",
    seo: { priority: 0.7, changeFrequency: "monthly" },
  },
  link: {
    category: "discoverability",
    seo: { priority: 0.65, changeFrequency: "monthly" },
  },
  email: {
    category: "discoverability",
    seo: { priority: 0.65, changeFrequency: "monthly" },
  },
  success: { category: "technicalFlow" },
  cancel: { category: "technicalFlow" },
  test: { category: "technicalFlow" },
} as const satisfies Record<string, SitePageDefinition>;

export type SitePageSlug = keyof typeof SITE_PAGES;
export type SeoPageSlug = {
  [Slug in SitePageSlug]: (typeof SITE_PAGES)[Slug] extends { seo: SeoSettings }
    ? Slug
    : never;
}[SitePageSlug];

const sitePageEntries = Object.entries(SITE_PAGES) as Array<
  [SitePageSlug, SitePageDefinition]
>;

export const PAGE_CATEGORIES = Object.fromEntries(
  (
    [
      "primaryVisibility",
      "discoverability",
      "technicalFlow",
    ] as const
  ).map((category) => [
    category,
    sitePageEntries
      .filter(([, page]) => page.category === category)
      .map(([slug]) => slug),
  ]),
) as Record<PageCategory, SitePageSlug[]>;

export const SEO_PAGE_SLUGS = sitePageEntries
  .filter(([, page]) => page.seo !== undefined)
  .map(([slug]) => slug) as SeoPageSlug[];

const seoPageSlugs = new Set<SitePageSlug>(SEO_PAGE_SLUGS);
const nextCanonicalSlugs = new Set<string>(NEXT_CANONICAL_SLUGS);

export const NON_INDEXABLE_ROBOTS = { index: false, follow: false } as const;

export function isSeoPageSlug(slug: string): slug is SeoPageSlug {
  return seoPageSlugs.has(slug as SitePageSlug);
}

export function isNextCanonicalSlug(slug: SitePageSlug) {
  return nextCanonicalSlugs.has(slug);
}

export function seoSettings(slug: SeoPageSlug): SeoSettings {
  const settings = (SITE_PAGES[slug] as SitePageDefinition).seo;
  if (!settings) throw new Error(`Missing SEO settings for page: ${slug}`);
  return settings;
}

function nextLocalePrefix(locale: AppLocale) {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

/**
 * Canonical public URL policy during the hybrid migration:
 * - The homepage is still the single legacy surface at `/` for every locale.
 * - French is Bababou's default locale and stays unprefixed for migrated Next
 *   routes. Other first-class locales are prefixed.
 * - Native Next canonical URLs never expose implementation extensions.
 * - Legacy HTML files remain versioned as fallbacks and parity sources even
 *   after their public URL redirects to a validated native route.
 */
export function canonicalPagePath(slug: SitePageSlug, locale: AppLocale) {
  if (slug === "index") return "/";

  if (isNextCanonicalSlug(slug)) {
    const prefix = nextLocalePrefix(locale);
    return `${prefix}/${slug}`;
  }

  return `${locale === "fr" ? "/fr" : ""}/${slug}.html`;
}


/**
 * Pure canonical paths for an approved React homepage.
 * Keep server-side approval OUT of the shared client catalog, because the
 * browser must not depend on Vercel non-public environment variables.
 */
export function releasedHomepagePath(locale: AppLocale): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

export function releasedHomepageAlternates(locale: AppLocale) {
  const languages = Object.fromEntries(
    routing.locales.map((supportedLocale) => [
      supportedLocale,
      releasedHomepagePath(supportedLocale),
    ]),
  );
  return {
    canonical: releasedHomepagePath(locale),
    languages: { ...languages, "x-default": "/" },
  };
}

export function pageAlternates(slug: SitePageSlug, locale: AppLocale) {
  const languages = Object.fromEntries(
    routing.locales.map((supportedLocale) => [
      supportedLocale,
      canonicalPagePath(slug, supportedLocale),
    ]),
  );
  const defaultPath = canonicalPagePath(slug, routing.defaultLocale);

  return {
    canonical: canonicalPagePath(slug, locale),
    languages: {
      ...languages,
      "x-default": defaultPath,
    },
  };
}
