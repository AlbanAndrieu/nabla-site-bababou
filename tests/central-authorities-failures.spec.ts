import { expect, test } from "@playwright/test";

const localeCases = [
  {
    path: "/central-authorities-failures",
    lang: "fr",
    heading:
      "Échec des autorités centrales : un père en Europe n’a pas pu faire localiser ni ramener son enfant",
    summary: "En bref",
  },
  {
    path: "/en/central-authorities-failures",
    lang: "en",
    heading:
      "Central Authorities Failed: A Father in Europe Could Not Have His Child Located or Returned",
    summary: "In short",
  },
  {
    path: "/de/central-authorities-failures",
    lang: "de",
    heading:
      "Versagen der Zentralbehörden: Ein Vater in Europa konnte sein Kind weder ausfindig machen noch zurückführen lassen",
    summary: "Kurz gesagt",
  },
  {
    path: "/no/central-authorities-failures",
    lang: "no",
    heading:
      "Sentralmyndighetene sviktet: En far i Europa fikk verken barnet lokalisert eller tilbakeført",
    summary: "Kort fortalt",
  },
] as const;

test.describe("Central Authorities failures React migration", () => {
  for (const localeCase of localeCases) {
    test(`renders native ${localeCase.lang} content`, async ({ page }) => {
      await page.goto(localeCase.path);

      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.lang);
      await expect(
        page.getByRole("heading", { level: 1, name: localeCase.heading }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: localeCase.summary }),
      ).toBeVisible();
      await expect(page.locator("#route-header-locale")).toHaveValue(
        localeCase.lang,
      );
      await expect(page.locator('link[href*="bootstrap"]')).toHaveCount(0);
      await expect(page.locator('script[src*="bootstrap"]')).toHaveCount(0);
    });
  }

  test("redirects the original English HTML URL to the English native route", async ({
    page,
  }) => {
    const response = await page.goto("/central-authorities-failures.html");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(
      "/en/central-authorities-failures",
    );
  });

  test("keeps long German copy responsive on a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/de/central-authorities-failures");

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    await expect(page.locator("#route-header-locale")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "Versäumnisse nach Ländern",
      }),
    ).toBeVisible();
  });
});
