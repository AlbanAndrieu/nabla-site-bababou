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
    });
  }
});
