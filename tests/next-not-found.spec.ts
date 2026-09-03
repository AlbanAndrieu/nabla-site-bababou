import { expect, test } from "@playwright/test";

const NOT_FOUND_PATHS = [
  "/missing-next-route-for-playwright",
  "/fr/missing-next-route-for-playwright",
  "/en/missing-next-route-for-playwright",
  "/de/missing-next-route-for-playwright",
  "/no/missing-next-route-for-playwright",
] as const;

test.describe("static global Next.js 404", () => {
  for (const path of NOT_FOUND_PATHS) {
    test(`${path} preserves the reviewed static 404 presentation`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);

      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute(
        "data-nabla-app",
        "next-global-not-found",
      );
      await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: "We can't find that page" }),
      ).toBeVisible();
      await expect(page.locator(".cloak__wrapper")).toBeVisible();
      await expect(page.getByRole("link", { name: /Back to home/i })).toHaveAttribute(
        "href",
        "/",
      );
      await expect(page.getByRole("banner")).toHaveCount(0);
      await expect(page.getByRole("contentinfo")).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.locator('script[src="/site-widgets.js"]')).toHaveAttribute(
        "data-minimal-chrome",
        "",
      );
    });
  }
});
