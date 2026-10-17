import { expect, test } from "@playwright/test";

const supportedLocales = [
  { route: "/contact", htmlLang: "fr", openGraphLocale: "fr_FR" },
  { route: "/en/contact", htmlLang: "en", openGraphLocale: "en_US" },
  { route: "/de/contact", htmlLang: "de", openGraphLocale: "de_DE" },
  { route: "/no/contact", htmlLang: "no", openGraphLocale: "nb_NO" },
] as const;

test.describe("P3/P4 — canonical and social metadata on real localized routes", () => {
  for (const { route, htmlLang, openGraphLocale } of supportedLocales) {
    test(`${route} has matching canonical, OpenGraph and language`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", htmlLang);

      // Duplicate canonicals can silently split SEO signals across locales.
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      const socialUrl = await page
        .locator('meta[property="og:url"]')
        .getAttribute("content");
      expect(canonical).toBeTruthy();
      expect(socialUrl).toBeTruthy();
      expect(new URL(canonical!, page.url()).pathname).toBe(route);
      expect(new URL(socialUrl!, page.url()).pathname).toBe(route);
      expect(new URL(canonical!, page.url()).origin).toBe(
        "https://bababou.com",
      );
      expect(new URL(socialUrl!, page.url()).origin).toBe(
        "https://bababou.com",
      );
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        "content",
        openGraphLocale,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );

      // Verify Next's *rendered* hreflang tags, not only the metadata helper.
      const alternatePaths = {
        fr: "/contact",
        en: "/en/contact",
        de: "/de/contact",
        no: "/no/contact",
        "x-default": "/contact",
      };
      const alternates = page.locator('link[rel="alternate"][hreflang]');
      await expect(alternates).toHaveCount(Object.keys(alternatePaths).length);
      for (const [language, expectedPath] of Object.entries(alternatePaths)) {
        const link = page.locator(
          `link[rel="alternate"][hreflang="${language}"]`,
        );
        await expect(link).toHaveCount(1);
        const href = await link.getAttribute("href");
        expect(href).toBeTruthy();
        const target = new URL(href!, page.url());
        expect(target.origin).toBe("https://bababou.com");
        expect(target.pathname).toBe(expectedPath);
        expect(target.search).toBe("");
        expect(target.hash).toBe("");
      }
    });
  }
});
