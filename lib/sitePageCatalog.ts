import { type AppLocale, routing } from "@/i18n/routing";

export type PageCategory =
  | "primaryVisibility"
  | "discoverability"
  | "editorialShowcase"
  | "portfolioEvidence"
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
 */
export const SITE_PAGES = {
  index: {
    category: "primaryVisibility",
    seo: { priority: 1, changeFrequency: "monthly" },
  },
  expertise: {
    category: "primaryVisibility",
    seo: { priority: 0.95, changeFrequency: "monthly" },
  },
  contact: {
    category: "primaryVisibility",
    seo: { priority: 0.9, changeFrequency: "monthly" },
  },
  security: {
    category: "editorialShowcase",
    seo: { priority: 0.85, changeFrequency: "monthly" },
  },
  ai: {
    category: "editorialShowcase",
    seo: { priority: 0.8, changeFrequency: "monthly" },
  },
  ciso: {
    category: "editorialShowcase",
    seo: { priority: 0.8, changeFrequency: "weekly" },
  },
  truenas: {
    category: "editorialShowcase",
    seo: { priority: 0.75, changeFrequency: "monthly" },
  },
  link: {
    category: "discoverability",
    seo: { priority: 0.65, changeFrequency: "monthly" },
  },
  email: {
    category: "discoverability",
    seo: { priority: 0.65, changeFrequency: "monthly" },
  },
  ctid: { category: "editorialShowcase" },
  freenas: { category: "editorialShowcase" },
  nabla: {
    category: "editorialShowcase",
    seo: { priority: 0.7, changeFrequency: "monthly" },
  },
  workstation: { category: "editorialShowcase" },
  cv: {
    category: "portfolioEvidence",
    seo: { priority: 0.7, changeFrequency: "monthly" },
  },
  jm: {
    category: "portfolioEvidence",
    seo: { priority: 0.65, changeFrequency: "monthly" },
  },
  startup: { category: "technicalFlow" },
  "startup-thanks": { category: "technicalFlow" },
  pricing: { category: "technicalFlow" },
  payment: { category: "technicalFlow" },
  success: { category: "technicalFlow" },
  cancel: { category: "technicalFlow" },
  checkout: { category: "technicalFlow" },
  "checkout-tjm": { category: "technicalFlow" },
  login: { category: "technicalFlow" },
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
      "editorialShowcase",
      "portfolioEvidence",
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
const nextCanonicalSlugs = new Set<SeoPageSlug>([
  "index",
  "contact",
  "email",
  "link",
]);

export const NON_INDEXABLE_ROBOTS = { index: false, follow: false } as const;

export function isSeoPageSlug(slug: string): slug is SeoPageSlug {
  return seoPageSlugs.has(slug as SitePageSlug);
}

export function isNextCanonicalSlug(slug: SeoPageSlug) {
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
 * - French is Bababou's default locale and stays unprefixed for native Next
 *   routes (`/contact`). Other first-class locales are prefixed (`/en/contact`).
 * - Native Next canonical URLs never expose implementation extensions.
 * - Legacy page URL semantics stay frozen until each page is explicitly
 *   migrated and validated; changing them implicitly would break the static
 *   fallback that still lives under public/.
 */
export function canonicalPagePath(slug: SeoPageSlug, locale: AppLocale) {
  if (isNextCanonicalSlug(slug)) {
    const prefix = nextLocalePrefix(locale);
    if (slug === "index") return prefix || "/";
    return `${prefix}/${slug}`;
  }

  // Preserve the pre-existing legacy URL policy until that route is migrated.
  if (slug === "cv" || slug === "jm") {
    return `${locale === "fr" ? "/fr" : ""}/${slug}`;
  }
  return `${locale === "fr" ? "/fr" : ""}/${slug}.html`;
}

export function pageAlternates(slug: SeoPageSlug, locale: AppLocale) {
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
