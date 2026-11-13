import { expect, test } from "@playwright/test";

for (const locale of ["fr", "en", "de", "no"] as const) {
  const prefix = locale === "fr" ? "" : `/${locale}`;
  test(`${locale}: React people directory and three footer links`, async ({ page }) => {
    const response = await page.goto(`${prefix}/people-contacted`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main#main-content h1")).toBeVisible();
    await expect(page.locator('[data-testid="people-react-tree"] details')).toHaveCount(
      await page.locator('[data-testid="people-react-tree"] details').count(),
    );
    await expect(page.locator('[data-testid="people-react-tree"] > li')).toHaveCount(5);
    await expect(page.locator('img[src="/assets/people-contacted-europe.avif"]')).toHaveCount(1);
    await expect(page.locator('footer .social-links a')).toHaveCount(3);
    await expect(page.locator('footer a[href="https://calendly.com/alban-andrieu"]')).toHaveCount(1);
    await expect(page.locator('footer a[href="https://github.com/AlbanAndrieu/nabla-site-bababou"]')).toHaveCount(1);
    await expect(page.locator('main [aria-labelledby]')).toHaveCount(await page.locator('main [aria-labelledby]').count());
    await page.setViewportSize({ width: 320, height: 750 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test(`${locale}: React authority thread preserves published 13 anchors`, async ({ page }) => {
    const response = await page.goto(`${prefix}/ca/demande-explications-autorites-competentes-fr`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main#main-content h1")).toBeVisible();
    await expect(page.locator('main [id^="email-"]')).toHaveCount(13);
    await expect(page.locator('footer .social-links a')).toHaveCount(3);
    await expect(page.locator('a[href^="/ca/Gmail%20-%20Demande"]')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
}

test("historical versions remain accessible before release authorization", async ({ request }) => {
  for (const path of ["/people-contacted.html", "/ca/demande-explications-autorites-competentes-fr.html"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  }
});
