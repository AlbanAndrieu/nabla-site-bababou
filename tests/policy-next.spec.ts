import { expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";
const CANONICAL_PATH = "/policy/accessibility_statement";

for (const path of [CANONICAL_PATH, `/en${CANONICAL_PATH}`]) {
  test(`accessibility policy uses native Next chrome at ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();

    await expect(page.locator("html")).toHaveAttribute("data-nabla-app", "next-intl");
    await expect(page.locator(".route-header")).toBeVisible();
    await expect(page.locator("footer.footer")).toBeVisible();
    await expect(page.locator("#main-content")).toHaveAttribute("lang", "en");
    await expect(page.locator("#main-content h1")).toHaveText(
      "Accessibility Statement",
    );
    await expect(page.locator('a[href="#main-content"]')).toBeVisible();

    const html = await page.content();
    expect(html).not.toMatch(/<script[^>]+theme-toggle\.js/i);
    expect(html).not.toMatch(/<script[^>]+site-google-translate\.js/i);
  });

  test(`accessibility policy publishes the clean canonical at ${path}`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE_URL}${CANONICAL_PATH}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${SITE_URL}${CANONICAL_PATH}`,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Accessibility Statement | Bababou",
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    );
  });
}

test("legacy accessibility HTML remains available as the source document", async ({
  request,
}) => {
  const response = await request.get("/policy/accessibility_statement.html");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain("<h1>Accessibility Statement</h1>");
  expect(html).toMatch(/site-google-translate\.js/);
});
