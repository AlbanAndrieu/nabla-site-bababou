import { expect, test } from "@playwright/test";

import { homeAudienceCopy } from "../lib/homeAudienceCopy.mjs";
import { isHomeCutoverEnabled } from "../lib/homeCutoverPolicy.mjs";

const locales = [
  { locale: "fr", path: "/" },
  { locale: "en", path: "/en" },
  { locale: "de", path: "/de" },
  { locale: "no", path: "/no" },
] as const;

// These tests must not mistake an editorial-only approval for a deployed GO.
// Run only against an exact-SHA approved deployment with browser gates enabled.
test.describe("Approved homepage cutover, four locales", () => {
  test.skip(!isHomeCutoverEnabled(), "Homepage release lock remains closed");

  for (const { locale, path } of locales) {
    test(`${locale}: native static homepage with protected editorial copy`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('html[data-nabla-app="next-intl"]')).toHaveCount(1);
      await expect(page.locator("main#main-content h1")).toHaveText(
        homeAudienceCopy(locale).child.title,
      );
      await expect(page.locator("#preview-story-gallery li")).toHaveCount(5);
      await expect(page.locator("#preview-story-gallery img")).toHaveCount(5);
      const prefix = locale === "fr" ? "" : `/${locale}`;
      await expect(page.locator(`#preview-footer a[href="${prefix}/policy/privacy_policy"]`)).toHaveCount(1);
      await expect(page.locator(`footer a[href="${path}"]`).first()).toBeVisible();

      await expect(page.locator('a.skip-to-main[href="#main-content"]')).toHaveCount(1);
      await expect(page.locator("main#main-content")).not.toContainText(/14CV[0-9]+/);
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
        "content", /noindex/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href", locale === "fr" ? "https://bababou.com/" : `https://bababou.com/${locale}`,
      );
      for (const candidate of ["fr", "en", "de", "no"]) {
        const target = candidate === "fr" ? "/" : `/${candidate}`;
        await expect(page.locator(`link[rel="alternate"][hreflang="${candidate}"]`))
          .toHaveAttribute("href", `https://bababou.com${target}`);
      }
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
      for (const width of [320, 375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const hasOverflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        expect(hasOverflow, `${path} at ${width}px`).toBe(false);
      }
    });
  }

  test("legacy archive remains available but is excluded from duplicate indexing", async ({ request }) => {
    const result = await request.get("/index.html");
    expect(result.status()).toBe(200);
    expect(await result.text()).toContain("<html");
    expect(result.headers()["x-robots-tag"] ?? "").toMatch(/noindex/);
  });
});
