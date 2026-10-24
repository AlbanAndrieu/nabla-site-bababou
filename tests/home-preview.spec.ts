import { expect, test } from "@playwright/test";

const enabled = process.env.HOMEPAGE_PREVIEW_ENABLED === "true";
const locales = [
  { code: "fr", path: "/home-preview" },
  { code: "en", path: "/en/home-preview" },
  { code: "de", path: "/de/home-preview" },
  { code: "no", path: "/no/home-preview" },
] as const;

test("homepage preview is not public without explicit server opt-in", async ({
  request,
}) => {
  test.skip(enabled, "Homepage preview is enabled for this test run");
  for (const { path } of locales) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test.describe("opt-in homepage migration preview", () => {
  test.skip(!enabled, "Set HOMEPAGE_PREVIEW_ENABLED=true on the test server");

  for (const { code, path } of locales) {
    test(`${code}: accessible landmarks, links and non-indexable metadata`, async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await expect(page.locator("main#main-content h1")).toHaveCount(1);
      await expect(page.locator('a.skip-to-main[href="#main-content"]')).toHaveCount(1);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://bababou.com/",
      );
      await expect(page.locator('main a[href="#preview-contact"]')).toHaveCount(1);
      await expect(page.locator('#preview-opening[lang="en"]')).toHaveCount(1);
      await expect(page.locator("#preview-opening-heading")).toContainText(
        "your Papa is looking for you",
      );
      await expect(page.locator("#preview-opening h3")).toHaveText("My Dear Daughter,");
      await expect(page.locator("#preview-opening p")).toHaveCount(2);
      await expect(page.locator('#preview-contact[lang="en"]')).toHaveCount(1);
      await expect(page.locator('#preview-contact-heading')).toHaveText("How to contact me");
      await expect(page.locator('#preview-contact a[href="mailto:aa@bababou.com"]')).toHaveText(
        "aa@bababou.com",
      );
      await expect(page.locator("#preview-contact")).toContainText(
        "I promise I will respond immediately.",
      );
      await expect(page.locator('#preview-letter[lang="en"]')).toHaveCount(1);
      await expect(page.locator('#preview-letter-heading')).toHaveText(
        "A Message from Your Papa:",
      );
      await expect(page.locator("#preview-letter blockquote p")).toHaveCount(3);
      await expect(page.locator("#preview-letter blockquote")).toContainText(
        "I will always be here for you.",
      );
      await expect(page.locator('#preview-found-website[lang="en"]')).toHaveCount(1);
      await expect(page.locator("#preview-found-website-heading")).toHaveText(
        "If you are Éléonore (Bababou) and you found this website:",
      );
      await expect(page.locator("#preview-found-website")).toContainText(
        "I am here waiting for you with open arms.",
      );
      await expect(page.locator("#preview-found-website")).toContainText(
        "He has been searching for you since 2015.",
      );
      await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(1);
      for (const href of ["/", "/people-contacted.html", "/for-fathers.html", "/feed.xml"]) {
        await expect(page.locator(`main a[href="${href}"]`)).toHaveCount(1);
      }
      for (const width of [320, 375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        expect(hasOverflow, `${code} at ${width}px`).toBe(false);
      }
    });
  }
});
