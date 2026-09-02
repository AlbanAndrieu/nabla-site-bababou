import { type APIRequestContext, expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";
const ROUTES = ["contact", "email", "link"] as const;
const LOCALES = [
  { locale: "fr", requestPrefix: "/fr", canonicalPrefix: "" },
  { locale: "en", requestPrefix: "/en", canonicalPrefix: "/en" },
  { locale: "de", requestPrefix: "/de", canonicalPrefix: "/de" },
  { locale: "no", requestPrefix: "/no", canonicalPrefix: "/no" },
] as const;

function canonical(path: string) {
  return new URL(path, SITE_URL).href;
}

function redirectPath(location: string | undefined) {
  expect(location, "redirect response should expose a Location header").toBeTruthy();
  return new URL(location ?? "/", SITE_URL).pathname;
}

async function applicationRedirect(request: APIRequestContext, path: string) {
  let response = await request.get(path, { maxRedirects: 0 });

  // Protected Vercel previews bootstrap their bypass cookie with a one-time 307
  // back to the exact same path. That infrastructure handshake is not the
  // application redirect under test. APIRequestContext keeps the Set-Cookie in
  // its cookie jar, so the immediate retry reaches Next.js itself.
  if (
    response.status() === 307 &&
    redirectPath(response.headers().location) === path
  ) {
    response = await request.get(path, { maxRedirects: 0 });
  }

  return response;
}

async function expectAlternates(
  page: import("@playwright/test").Page,
  expected: {
    canonical: string;
    de: string;
    en: string;
    fr: string;
    no: string;
    xDefault: string;
  },
) {
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    canonical(expected.canonical),
  );

  for (const locale of ["fr", "en", "de", "no"] as const) {
    await expect(
      page.locator(`link[rel="alternate"][hreflang="${locale}"]`),
    ).toHaveAttribute("href", canonical(expected[locale]));
  }

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
    for (const { locale, requestPrefix, canonicalPrefix } of LOCALES) {
      test(`${route} renders ${locale} canonical, hreflang and social metadata`, async ({
        page,
      }) => {
        const path = `${requestPrefix}/${route}`;
        const canonicalPath = `${canonicalPrefix}/${route}`;

        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expectAlternates(page, {
          canonical: canonicalPath,
          fr: `/${route}`,
          en: `/en/${route}`,
          de: `/de/${route}`,
          no: `/no/${route}`,
          xDefault: `/${route}`,
        });
        await expectSocialMetadata(page, canonicalPath);
      });
    }
  }

  test("locale switcher exposes all first-class locales", async ({ page }) => {
    await page.goto("/de/contact");
    const switcher = page.locator("#route-header-locale");

    await expect(switcher).toHaveValue("de");
    await expect(switcher.locator("option")).toHaveCount(4);
    await expect(switcher.locator('option[value="fr"]')).toHaveCount(1);
    await expect(switcher.locator('option[value="en"]')).toHaveCount(1);
    await expect(switcher.locator('option[value="de"]')).toHaveCount(1);
    await expect(switcher.locator('option[value="no"]')).toHaveCount(1);
  });

  test("technical test route renders noindex and nofollow", async ({ page }) => {
    await page.goto("/no/test");
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
      const response = await applicationRedirect(request, `/${route}.html`);
      expect(response.status()).toBe(308);
      expect(redirectPath(response.headers().location)).toBe(`/en/${route}`);
    });

    test(`/fr/${route}.html permanently redirects to the French canonical`, async ({
      request,
    }) => {
      const response = await applicationRedirect(
        request,
        `/fr/${route}.html`,
      );
      expect(response.status()).toBe(308);
      expect(redirectPath(response.headers().location)).toBe(`/${route}`);
    });
  }
});
