import { expect, test, type Page } from "@playwright/test";

import { isUnexpectedReviewRequest } from "../lib/homePreviewNetworkAudit.mjs";

/**
 * Observe the actual request stream on all four public review routes.
 * No outside host, including an unlisted analytics provider, should be
 * contacted by a page that contains no opt-in third-party integration.
 * Requests are sanitized before assertion output (no query strings).
 */
const previewPaths = [
  "/home-preview",
  "/en/home-preview",
  "/de/home-preview",
  "/no/home-preview",
] as const;

function captureRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on("request", (request) => {
    try {
      const url = new URL(request.url());
      // Record protocol, hostname and path only, never query or body.
      requests.push(url.origin + url.pathname);
    } catch {
      requests.push("invalid-request-url");
    }
  });
  return requests;
}

function unexpectedRequests(requests: string[], applicationUrl: string) {
  return requests.filter((url) =>
    isUnexpectedReviewRequest(url, applicationUrl),
  );
}

test.describe("React homepage review — browser network privacy", () => {
  for (const path of previewPaths) {
    test(`${path} loads no analytics or external resources, even with third-party override`, async ({ page }) => {
      const requests = captureRequests(page);
      const response = await page.goto(
        path + "?nablaEnableThirdParty=1",
        { waitUntil: "domcontentloaded" },
      );
      expect(response?.status(), path).toBe(200);
      await expect(page.locator("main#main-content")).toBeVisible();

      // A blank response with no requests must never count as a privacy PASS.
      await expect(page.locator('script[src="/site-analytics.js"]')).toHaveCount(1);
      await page.waitForLoadState("networkidle");
      expect(
        unexpectedRequests(requests, response?.url() ?? page.url()),
        "Unexpected outbound requests on " + path,
      ).toEqual([]);
      expect(
        await page.evaluate(() =>
          typeof (window as Window & { NABLA_SITE_ANALYTICS?: unknown }).NABLA_SITE_ANALYTICS,
        ),
      ).toBe("undefined");
    });
  }

  test("switching preview locale through Next navigation does not initialize tracking", async ({ page }) => {
    const requests = captureRequests(page);
    const initial = await page.goto(
      "/home-preview?nablaEnableThirdParty=1",
      { waitUntil: "domcontentloaded" },
    );
    expect(initial?.status()).toBe(200);
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator("#route-header-locale")).toHaveValue("fr");

    // RouteHeader uses Next router.replace, not a synthetic history change.
    await page.locator("#route-header-locale").selectOption("en");
    await expect(page).toHaveURL(/\/en\/home-preview(?:\?.*)?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main#main-content")).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(
      unexpectedRequests(requests, page.url()),
      "Locale transition emitted a third-party or first-party telemetry request",
    ).toEqual([]);
    expect(
      await page.evaluate(() =>
        typeof (window as Window & { NABLA_SITE_ANALYTICS?: unknown }).NABLA_SITE_ANALYTICS,
      ),
    ).toBe("undefined");
  });
});
