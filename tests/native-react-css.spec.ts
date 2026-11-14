import { expect, test } from "@playwright/test";

const routes = ["/home-preview", "/en/nre", "/de/people-contacted", "/no/for-fathers", "/contact", "/en/ca/demande-explications-autorites-competentes-fr"] as const;

test("native React pages load no historical global CSS bundles", async ({ page }) => {
  const legacyRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/(?:wireframe|landing-sections|style|theme)\.css(?:\?|$)/.test(request.url())) legacyRequests.push(request.url());
  });
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('html[data-nabla-app="next-intl"]')).toHaveCount(1);
    for (const name of ["wireframe.css", "landing-sections.css", "style.css", "theme.css"]) {
      await expect(page.locator('link[rel="stylesheet"][href*="' + name + '"]')).toHaveCount(0);
    }
    const heading = page.locator("main#main-content h1");
    await expect(heading).toBeVisible();
    const result = await heading.evaluate((node) => {
      const css = getComputedStyle(node);
      return { size: parseFloat(css.fontSize), weight: parseInt(css.fontWeight, 10) };
    });
    expect(result.size, route).toBeGreaterThan(20);
    expect(result.weight, route).toBeGreaterThanOrEqual(600);
    if (route === "/contact") {
      await expect(page.locator('main a[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('main a[href^="https://calendly.com/"]')).toBeVisible();
    }
  }
  expect(legacyRequests).toEqual([]);
});

test("historic HTML archive keeps its own stylesheet for rollback", async ({ request }) => {
  const response = await request.get("/index.html");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('href="wireframe.css"');
});


test("native colors remain legible in explicit light and dark modes", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("site-theme-preference", "light");
  });
  await page.goto("/en/nre");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const light = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(light).toBe("rgb(255, 255, 255)");

  await page.evaluate(() => localStorage.setItem("site-theme-preference", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const dark = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dark).toBe("rgb(26, 26, 26)");
});
