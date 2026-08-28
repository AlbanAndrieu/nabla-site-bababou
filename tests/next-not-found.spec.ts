import { expect, test } from "@playwright/test";

const NOT_FOUND_CASES = [
  {
    path: "/missing-next-route-for-playwright",
    lang: "fr",
    title: "Cette page est introuvable",
  },
  {
    path: "/en/missing-next-route-for-playwright",
    lang: "en",
    title: "This page is missing",
  },
] as const;

test.describe("localized Next.js 404", () => {
  for (const pageCase of NOT_FOUND_CASES) {
    test(`${pageCase.lang} extensionless unknown route uses native Next chrome`, async ({
      request,
    }) => {
      const response = await request.get(pageCase.path);
      expect(response.status()).toBe(404);

      const html = await response.text();
      expect(html).toContain(`lang="${pageCase.lang}"`);
      expect(html).toContain('data-nabla-app="next-intl"');
      expect(html).toContain('id="top"');
      expect(html).toContain('class="skip-to-main"');
      expect(html).toContain('id="main-content"');
      expect(html).toContain('class="route-header');
      expect(html).toContain('class="footer text-center"');
      expect(html).toContain(pageCase.title);
      expect(html).toMatch(/<meta[^>]+name="robots"[^>]+content="noindex"/i);
      expect(html).not.toMatch(/<script[^>]+theme-toggle\.js/i);
      expect(html).not.toMatch(/<script[^>]+site-google-translate\.js/i);
    });
  }

  test("legacy file-like 404 fallback remains available during the hybrid migration", async ({
    request,
  }) => {
    const response = await request.get("/404.html");
    expect(response.status()).toBe(404);

    const html = await response.text();
    expect(html).toMatch(/404|not found/i);
    expect(html).not.toContain('data-nabla-app="next-intl"');
  });
});
