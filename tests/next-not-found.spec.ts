import { expect, test } from "@playwright/test";

const NOT_FOUND_PATHS = [
  "/missing-next-route-for-playwright",
  "/fr/missing-next-route-for-playwright",
  "/en/missing-next-route-for-playwright",
  "/de/missing-next-route-for-playwright",
  "/no/missing-next-route-for-playwright",
  "/people-contactedsss.html",
  "/fr/people-contactedsss.html",
] as const;

const LEGACY_NOT_FOUND_PATHS = [
  "/people-contactedsss.html",
  "/fr/people-contactedsss.html",
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

  test("legacy HTML fallback keeps HEAD as a non-indexable 404", async ({ request }) => {
    for (const path of LEGACY_NOT_FOUND_PATHS) {
      const response = await request.head(path);
      expect(response.status()).toBe(404);
      expect(response.headers()["x-robots-tag"]).toContain("noindex");
      expect(response.headers()["cache-control"]).toContain("no-store");
    }
  });

  test("existing legacy HTML stays ahead of the fallback rewrite", async ({
    page,
    request,
  }) => {
    const response = await page.goto("/people-contacted.html");
    expect(response?.status()).toBe(200);
    await expect(page.locator('html[data-nabla-app="next-global-not-found"]')).toHaveCount(
      0,
    );

    const headResponse = await request.head("/people-contacted.html");
    expect(headResponse.status()).toBe(200);
  });
});
