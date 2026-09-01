import { expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";

const POLICIES = [
  {
    path: "/policy/accessibility_statement",
    heading: "Accessibility Statement",
    title: "Accessibility Statement | Bababou",
    legacyFile: "/policy/accessibility_statement.html",
  },
  {
    path: "/policy/cookie_policy",
    heading: "Cookie Policy",
    title: "Cookie Policy | Bababou",
    legacyFile: "/policy/cookie_policy.html",
  },
] as const;

for (const policy of POLICIES) {
  for (const localePrefix of ["", "/en"] as const) {
    const path = `${localePrefix}${policy.path}`;

    test(`${policy.heading} uses native Next chrome at ${path}`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();

      await expect(page.locator("html")).toHaveAttribute(
        "data-nabla-app",
        "next-intl",
      );
      await expect(page.locator(".route-header")).toBeVisible();
      await expect(page.locator("footer.footer")).toBeVisible();
      await expect(page.locator("#main-content")).toHaveAttribute("lang", "en");
      await expect(page.locator("#main-content h1")).toHaveText(policy.heading);
      await expect(page.locator('a[href="#main-content"]')).toBeVisible();

      const html = await page.content();
      expect(html).not.toMatch(/<script[^>]+theme-toggle\.js/i);
      expect(html).not.toMatch(/<script[^>]+site-google-translate\.js/i);

      if (policy.path === "/policy/cookie_policy") {
        await expect(
          page.locator(
            `#main-content a[href="${localePrefix}${"/policy/privacy_policy"}"]`,
          ),
        ).toHaveCount(2);
      }
    });

    test(`${policy.heading} publishes the clean canonical at ${path}`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE_URL}${policy.path}`,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        `${SITE_URL}${policy.path}`,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        policy.title,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary",
      );
    });
  }

  test(`legacy ${policy.heading} HTML remains available as the source document`, async ({
    request,
  }) => {
    const response = await request.get(policy.legacyFile);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(html).toContain(`<h1>${policy.heading}</h1>`);
    expect(html).toMatch(/site-google-translate\.js/);
  });
}
