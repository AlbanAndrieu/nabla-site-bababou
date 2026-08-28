import { expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";
const ROUTES = ["contact", "email", "link"] as const;

function canonical(path: string) {
  return new URL(path, SITE_URL).href;
}

function redirectPath(location: string | undefined) {
  expect(location, "redirect response should expose a Location header").toBeTruthy();
  return new URL(location ?? "/", SITE_URL).pathname;
}

async function expectAlternates(
  page: import("@playwright/test").Page,
  expected: { canonical: string; en: string; fr: string; xDefault: string },
) {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonical(expected.canonical),
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="fr"]'),
  ).toHaveAttribute("href", canonical(expected.fr));
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute("href", canonical(expected.en));
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveAttribute("href", canonical(expected.xDefault));
}

async function expectSocialMetadata(
  page: import("@playwright/test").Page,
  expectedCanonical: string,
) {
  const ogTitle = page.locator('meta[property="og:title"]');
  const ogDescription = page.locator('meta[property="og:description"]');

  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "website",
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    canonical(expectedCanonical),
  );
  await expect(ogTitle).toHaveAttribute("content", /.+/);
  await expect(ogDescription).toHaveAttribute("content", /.+/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /^https:\/\//,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const title = await ogTitle.getAttribute("content");
  const description = await ogDescription.getAttribute("content");
  expect(title).toBeTruthy();
  expect(description).toBeTruthy();
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    title ?? "",
  );
  await expect(
    page.locator('meta[name="twitter:description"]'),
  ).toHaveAttribute("content", description ?? "");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /^https:\/\//,
  );
}

test.describe("native Next SEO locale metadata", () => {
  for (const route of ROUTES) {
    test(`${route} renders French canonical, hreflang and social metadata`, async ({
      page,
    }) => {
      // Locale detection is enabled and the CI browser defaults to English.
      // Target the explicit French route so this test validates metadata rather
      // than the browser-language negotiation performed for an unprefixed URL.
      await page.goto(`/fr/${route}`);
      await expectAlternates(page, {
        canonical: `/${route}`,
        fr: `/${route}`,
        en: `/en/${route}`,
        xDefault: `/${route}`,
      });
      await expectSocialMetadata(page, `/${route}`);
    });

    test(`${route} renders English prefixed canonical, hreflang and social metadata`, async ({
      page,
    }) => {
      await page.goto(`/en/${route}`);
      await expectAlternates(page, {
        canonical: `/en/${route}`,
        fr: `/${route}`,
        en: `/en/${route}`,
        xDefault: `/${route}`,
      });
      await expectSocialMetadata(page, `/en/${route}`);
    });
  }

  test("technical test route renders noindex and nofollow", async ({ page }) => {
    await page.goto("/en/test");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex.*nofollow|nofollow.*noindex/i,
    );
  });
});

test.describe("migrated legacy Next redirects", () => {
  for (const route of ROUTES) {
    test(`${route}.html permanently redirects to the English canonical`, async ({
      request,
    }) => {
      const response = await request.get(`/${route}.html`, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      expect(redirectPath(response.headers().location)).toBe(`/en/${route}`);
    });

    test(`/fr/${route}.html permanently redirects to the French canonical`, async ({
      request,
    }) => {
      const response = await request.get(`/fr/${route}.html`, {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(308);
      expect(redirectPath(response.headers().location)).toBe(`/${route}`);
    });
  }
});
