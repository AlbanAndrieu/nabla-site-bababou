import { expect, test } from "@playwright/test";

const locales = [
  { locale: "fr", prefix: "" },
  { locale: "en", prefix: "/en" },
  { locale: "de", prefix: "/de" },
  { locale: "no", prefix: "/no" },
] as const;
const articles = ["for-fathers", "abduction-norway", "abduction-germany"] as const;

test.describe("Historical articles — React review only", () => {
  for (const { locale, prefix } of locales) {
    for (const slug of articles) {
      test(slug + " renders native " + locale + " preview without replacing historical HTML", async ({ page }) => {
        const response = await page.goto(prefix + "/" + slug);
        expect(response?.ok()).toBe(true);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("main#main-content h1")).toBeVisible();
        await expect(page.getByTestId("article-review-sections").locator(":scope > section")).toHaveCount(4);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        await expect(page.locator('a[href="/' + slug + '.html"]')).toBeVisible();
        await expect(page.locator('a[href^="https://www.hcch.net/"]')).toBeVisible();
        await expect(page.locator('main a[href$=".pdf"], main a[href$=".docx"]')).toHaveCount(0);
        await expect(page.locator('main iframe')).toHaveCount(0);
        if (slug === "for-fathers") {
          await expect(page.locator("#preview-associations a")).toHaveCount(3);
        }
        await expect(page.locator("main")).not.toContainText(/originalObjectKey|OPENRAG_API_KEY/);
      });
    }
  }

  test("parent review page links the three newly migrated article previews", async ({ page }) => {
    await page.goto("/en/abduction");
    for (const slug of articles) {
      await expect(page.locator('nav a[href="/en/' + slug + '"]')).toBeVisible();
    }
  });

  test("review cards reflow on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 820 });
    await page.goto("/en/for-fathers");
    const sections = page.getByTestId("article-review-sections").locator(":scope > section");
    const bounds = await Promise.all([sections.nth(0).boundingBox(), sections.nth(1).boundingBox()]);
    expect(bounds[0]).not.toBeNull();
    expect(bounds[1]).not.toBeNull();
    expect(bounds[1]!.y).toBeGreaterThan(bounds[0]!.y);
  });

  test("the complete approved archive remains available under its historical URL", async ({ page }) => {
    for (const slug of articles) {
      const response = await page.goto("/" + slug + ".html");
      expect(response?.ok()).toBe(true);
      expect(new URL(page.url()).pathname).toBe("/" + slug + ".html");
    }
  });
});
