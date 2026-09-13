import { expect, test } from "@playwright/test";

const localeCases = [
  { path: "/nre", lang: "fr" },
  { path: "/en/nre", lang: "en" },
  { path: "/de/nre", lang: "de" },
  { path: "/no/nre", lang: "no" },
] as const;

test.describe("NRE React migration", () => {
  for (const localeCase of localeCases) {
    test(`renders native ${localeCase.lang} content`, async ({ page }) => {
      await page.goto(localeCase.path);

      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.lang);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("main table")).toBeVisible();
      await expect(page.locator("#route-header-locale")).toHaveValue(
        localeCase.lang,
      );
      await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
      await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    });
  }

  test("redirects retained French and English legacy NRE URLs", async ({ page }) => {
    await page.goto("/nre-fr.html");
    expect(new URL(page.url()).pathname).toBe("/nre");

    await page.goto("/nre-en.html");
    expect(new URL(page.url()).pathname).toBe("/en/nre");
  });
});
