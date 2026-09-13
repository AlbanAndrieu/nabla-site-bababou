import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MetadataRoute } from "next";

import { type AppLocale, routing } from "@/i18n/routing";
import {
  isPolicyPageSlug,
  POLICY_PAGES,
  POLICY_PAGE_SLUGS,
  type PolicyPageSlug,
} from "@/lib/policyPages";
import {
  canonicalPagePath,
  SEO_PAGE_SLUGS,
  seoSettings,
} from "@/lib/sitePageCatalog";

const SITE_URL = "https://bababou.com";
const MIGRATED_LEGACY_PATHS = new Set([
  "/contact.html",
  "/central-authorities.html",
  "/central-authorities-failures.html",
  "/ca/index.html",
  "/nre-fr.html",
  "/nre-en.html",
  "/email.html",
  "/link.html",
]);
const CHANGE_FREQUENCIES = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

function textTag(block: string, tag: string) {
  return block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"))?.[1].trim();
}

function normalizeLegacyLocation(location: string) {
  const url = new URL(location);
  if (url.origin !== SITE_URL) return null;

  if (MIGRATED_LEGACY_PATHS.has(url.pathname)) return null;
  if (url.pathname === "/index.html") url.pathname = "/";

  const policySource = url.pathname.match(/^\/policy\/([^/]+)\.html$/);
  if (policySource && isPolicyPageSlug(policySource[1])) {
    url.pathname = `/policy/${policySource[1]}`;
  }

  return url.href;
}

function parseLegacySitemap(xml: string): MetadataRoute.Sitemap {
  const activeXml = xml.replace(/<!--[\s\S]*?-->/g, "");
  const entries: MetadataRoute.Sitemap = [];

  for (const match of activeXml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const block = match[1];
    const location = textTag(block, "loc");
    if (!location) continue;

    const url = normalizeLegacyLocation(location);
    if (!url) continue;

    const lastModified = textTag(block, "lastmod");
    const rawChangeFrequency = textTag(block, "changefreq");
    const rawPriority = textTag(block, "priority");
    const parsedPriority = rawPriority ? Number(rawPriority) : undefined;
    const changeFrequency =
      rawChangeFrequency && CHANGE_FREQUENCIES.has(rawChangeFrequency)
        ? (rawChangeFrequency as ChangeFrequency)
        : undefined;

    entries.push({
      url,
      ...(lastModified ? { lastModified } : {}),
      ...(changeFrequency ? { changeFrequency } : {}),
      ...(Number.isFinite(parsedPriority) ? { priority: parsedPriority } : {}),
    });
  }

  return entries;
}

function localizedPolicyIndexPath(locale: AppLocale) {
  return locale === routing.defaultLocale ? "/policy" : `/${locale}/policy`;
}

function localizedPolicyPath(slug: PolicyPageSlug, locale: AppLocale) {
  const primaryPath = POLICY_PAGES[slug].canonicalPath;
  return locale === routing.defaultLocale ? primaryPath : `/${locale}${primaryPath}`;
}

function policyIndexSitemapEntry(): SitemapEntry {
  const url = new URL("/policy", SITE_URL).href;
  const languages = Object.fromEntries([
    ...routing.locales.map((locale) => [
      locale,
      new URL(localizedPolicyIndexPath(locale), SITE_URL).href,
    ]),
    ["x-default", url],
  ]);

  return {
    url,
    changeFrequency: "yearly",
    priority: 0.4,
    alternates: { languages },
  };
}

function policySitemapEntries(
  existingEntries: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  const existingByUrl = new Map(existingEntries.map((entry) => [entry.url, entry]));

  return POLICY_PAGE_SLUGS.map((slug) => {
    const primaryPath = POLICY_PAGES[slug].canonicalPath;
    const url = new URL(primaryPath, SITE_URL).href;
    const existing = existingByUrl.get(url);
    const base = existing ?? {
      url,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    };
    const languages = Object.fromEntries([
      ...routing.locales.map((locale) => [
        locale,
        new URL(localizedPolicyPath(slug, locale), SITE_URL).href,
      ]),
      ["x-default", url],
    ]);

    return {
      ...base,
      alternates: { languages },
    };
  });
}

function nextSitemapEntries(): MetadataRoute.Sitemap {
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const legacyXml = await readFile(
    path.join(process.cwd(), "public", "sitemap.xml"),
    "utf8",
  );
  const legacyEntries = parseLegacySitemap(legacyXml);
  const combined = [
    ...legacyEntries,
    policyIndexSitemapEntry(),
    ...policySitemapEntries(legacyEntries),
    ...nextSitemapEntries(),
  ];
  const unique = new Map(combined.map((entry) => [entry.url, entry]));

  return [...unique.values()];
}
