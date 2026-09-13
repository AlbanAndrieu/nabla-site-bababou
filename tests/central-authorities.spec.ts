import { expect, test } from "@playwright/test";

const localeCases = [
  { path: "/central-authorities", lang: "fr", heading: "Saisir les Autorités centrales", timeline: "Chronologie : du premier contact à aujourd’hui" },
  { path: "/en/central-authorities", lang: "en", heading: "Reaching Central Authorities", timeline: "Timeline: from first contact to today" },
  { path: "/de/central-authorities", lang: "de", heading: "Kontakt mit Zentralen Behörden", timeline: "Zeitleiste: vom ersten Kontakt bis heute" },
  { path: "/no/central-authorities", lang: "no", heading: "Kontakt med sentralmyndigheter", timeline: "Tidslinje: fra første kontakt til i dag" },
] as const;

test.describe("Central Authorities React migration", () => {
  for (const localeCase of localeCases) {
    test(`renders native ${localeCase.lang} content`, async ({ page }) => {
      await page.goto(localeCase.path);

      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.lang);
      await expect(page.getByRole("heading", { level: 1, name: localeCase.heading })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: localeCase.timeline })).toBeVisible();
      await expect(page.locator("#route-header-locale")).toHaveValue(localeCase.lang);
      await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
      await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    });
  }

  test("redirects the original English HTML URL to the English native route", async ({ page }) => {
    const response = await page.goto("/central-authorities.html");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/en/central-authorities");
  });

  test("keeps long German legal and contact copy responsive at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/de/central-authorities");

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    await expect(page.getByRole("heading", { level: 2, name: /Rechtliche Grundlagen/ })).toBeVisible();
    await expect(page.locator("#route-header-locale")).toBeVisible();
  });
});
