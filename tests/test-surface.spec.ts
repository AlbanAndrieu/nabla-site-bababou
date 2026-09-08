import { expect, test } from "@playwright/test";

const localizedRoutes = [
  {
    path: "/test",
    lang: "fr",
    heading: "Surface de test du framework OSINT",
  },
  {
    path: "/en/test",
    lang: "en",
    heading: "OSINT framework test surface",
  },
  {
    path: "/de/test",
    lang: "de",
    heading: "Testfläche für das OSINT-Framework",
  },
  {
    path: "/no/test",
    lang: "no",
    heading: "Testflate for OSINT-rammeverket",
  },
] as const;

test.describe("Localized migration test surface", () => {
  for (const route of localizedRoutes) {
    test(`${route.lang} route is localized and non-indexable`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.locator("html")).toHaveAttribute("lang", route.lang);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        route.heading,
      );
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });
  }

  test("legacy test.html remains a distinct ARF-backed fallback", async ({
    page,
  }) => {
    await page.goto("/test.html");

    await expect(page).toHaveURL(/\/test\.html$/);
    await expect(page.locator('script[src$="d3.v3.min.js"]')).toHaveCount(1);
    await expect(page.locator('script[src$="arf.js"]')).toHaveCount(1);
    await expect(page.locator('script[src$="index.js"]')).toHaveCount(1);
  });
});
