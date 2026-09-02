import { type APIRequestContext, expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";

const POLICIES = [
  {
    path: "/policy/accessibility_statement",
    heading: "Accessibility Statement",
    title: "Accessibility Statement | Bababou",
    relatedPolicies: [],
  },
  {
    path: "/policy/cookie_policy",
    heading: "Cookie Policy",
    title: "Cookie Policy | Bababou",
    relatedPolicies: ["privacy_policy"],
  },
  {
    path: "/policy/impressum",
    heading: "Impressum (Legal Notice)",
    title: "Impressum (Legal Notice) | Bababou",
    relatedPolicies: ["privacy_policy", "service_terms"],
  },
  {
    path: "/policy/legal",
    heading: "Legal notices",
    title: "Legal notices | Alban Andrieu",
    relatedPolicies: ["privacy_policy", "service_terms"],
  },
  {
    path: "/policy/privacy_policy",
    heading: "Privacy Policy",
    title: "Privacy Policy | Bababou",
    relatedPolicies: [],
  },
  {
    path: "/policy/service_terms",
    heading: "Terms of Service",
    title: "Terms of Service | Bababou",
    relatedPolicies: [],
  },
] as const;

const LOCALE_ROUTES = [
  { requestPrefix: "/fr", localizedPrefix: "" },
  { requestPrefix: "/en", localizedPrefix: "/en" },
] as const;

function redirectPath(location: string | undefined) {
  expect(location, "redirect response should expose a Location header").toBeTruthy();
  return new URL(location ?? "/", SITE_URL).pathname;
}

async function applicationRedirect(request: APIRequestContext, path: string) {
  let response = await request.get(path, { maxRedirects: 0 });

  if (
    response.status() === 307 &&
    redirectPath(response.headers().location) === path
  ) {
    response = await request.get(path, { maxRedirects: 0 });
  }

  return response;
}

for (const policy of POLICIES) {
  for (const { requestPrefix, localizedPrefix } of LOCALE_ROUTES) {
    const path = `${requestPrefix}${policy.path}`;

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
      await expect(
        page.locator('#main-content a[href$=".html"]'),
      ).toHaveCount(0);

      const html = await page.content();
      expect(html).not.toMatch(/<script[^>]+theme-toggle\.js/i);
      expect(html).not.toMatch(/<script[^>]+site-google-translate\.js/i);

      for (const relatedPolicy of policy.relatedPolicies) {
        const links = page.locator(
          `#main-content a[href="${localizedPrefix}/policy/${relatedPolicy}"]`,
        );
        expect(await links.count()).toBeGreaterThan(0);
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

  test(`legacy ${policy.heading} HTML permanently redirects to the clean policy route`, async ({
    request,
  }) => {
    const legacyPath = `${policy.path}.html`;
    const response = await applicationRedirect(request, legacyPath);

    expect(response.status()).toBe(308);
    expect(redirectPath(response.headers().location)).toBe(policy.path);
  });
}
