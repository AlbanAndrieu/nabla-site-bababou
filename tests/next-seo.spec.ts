import { expect, test } from "@playwright/test";

const SITE_URL = "https://bababou.com";
const ROUTES = ["contact", "email", "link"] as const;

function canonical(path: string) {
  return new URL(path, SITE_URL).href;
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

test.describe("native Next SEO locale metadata", () => {
  for (const route of ROUTES) {
    test(`${route} renders French default canonical and hreflang`, async ({
      page,
    }) => {
      await page.setExtraHTTPHeaders({
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      });
      await page.goto(`/${route}`);
      await expectAlternates(page, {
        canonical: `/${route}`,
        fr: `/${route}`,
        en: `/en/${route}`,
        xDefault: `/${route}`,
      });
    });

    test(`${route} renders English prefixed canonical and hreflang`, async ({
      page,
    }) => {
      await page.goto(`/en/${route}`);
      await expectAlternates(page, {
        canonical: `/en/${route}`,
        fr: `/${route}`,
        en: `/en/${route}`,
        xDefault: `/${route}`,
      });
    });
  }
});
