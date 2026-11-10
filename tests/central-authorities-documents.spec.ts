import { expect, test } from "@playwright/test";

const localeCases = [
  { path: "/central-authorities-documents", lang: "fr" },
  { path: "/en/central-authorities-documents", lang: "en" },
  { path: "/de/central-authorities-documents", lang: "de" },
  { path: "/no/central-authorities-documents", lang: "no" },
] as const;

test.describe("Central Authority document hub migration", () => {
  for (const localeCase of localeCases) {
    test(`renders native ${localeCase.lang} archive navigation`, async ({ page }) => {
      await page.goto(localeCase.path);

      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.lang);
      await expect(page.locator("main h1")).toBeVisible();
      const publishedEntry = page.locator("[data-document-entry]").first();
      await expect(publishedEntry).toBeVisible();
      await expect(publishedEntry).not.toContainText("| Bababou");
      await expect(page.locator("[data-document-entry] + a.document-access-request")).toHaveCount(0);
      await expect(page.locator("#route-header-locale")).toHaveValue(localeCase.lang);
      await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
      await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    });
  }

  test("legacy hub converges on the English native route", async ({ page }) => {
    await page.goto("/ca/index.html");
    expect(new URL(page.url()).pathname).toBe("/en/central-authorities-documents");
  });

  test("generated archive entries resolve to retained files", async ({ page, request }) => {
    await page.goto("/en/central-authorities-documents");
    const firstHref = await page.locator("[data-document-entry]").first().getAttribute("href");
    expect(firstHref).toBeTruthy();

    const response = await request.get(firstHref!);
    expect(response.status()).toBe(200);
  });
});
