import { expect, test } from "@playwright/test";

const NOT_FOUND_CASES = [
  {
    path: "/fr/missing-next-route-for-playwright",
    lang: "fr",
    title: "Cette page est introuvable",
    skipLabel: "Aller au contenu principal",
  },
  {
    path: "/en/missing-next-route-for-playwright",
    lang: "en",
    title: "This page is missing",
    skipLabel: "Skip to main content",
  },
] as const;

test.describe("localized Next.js 404", () => {
  for (const pageCase of NOT_FOUND_CASES) {
    test(`${pageCase.lang} extensionless unknown route uses native Next chrome`, async ({
      page,
    }) => {
      const response = await page.goto(pageCase.path);
      expect(response?.status()).toBe(404);

      await expect(page.locator("html")).toHaveAttribute("lang", pageCase.lang);
      await expect(page.locator("html")).toHaveAttribute(
        "data-nabla-app",
        "next-intl",
      );
      await expect(page.locator("#top")).toHaveCount(1);
      await expect(
        page.getByRole("link", { name: pageCase.skipLabel }),
      ).toHaveAttribute("href", "#main-content");
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1, name: pageCase.title }),
      ).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.locator('script[src*="theme-toggle.js"]')).toHaveCount(0);
      await expect(
        page.locator('script[src*="site-google-translate.js"]'),
      ).toHaveCount(0);
    });
  }

  test("legacy file-like 404 fallback remains available during the hybrid migration", async ({
    request,
  }) => {
    const response = await request.get("/404.html");
    expect(response.status()).toBe(404);

    const html = await response.text();
    expect(html).toMatch(/404|not found/i);
    expect(html).not.toContain('data-nabla-app="next-intl"');
  });
});
