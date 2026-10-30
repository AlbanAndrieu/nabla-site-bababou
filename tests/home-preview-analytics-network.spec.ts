import { expect, test, type BrowserContext, type Page } from "@playwright/test";

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

type CapturedRequest = { url: string; method: string };

function captureRequests(context: BrowserContext, page: Page): CapturedRequest[] {
  const requests: CapturedRequest[] = [];
  function capture(rawUrl: string, method: string) {
    try {
      const url = new URL(rawUrl);
      // Record only method, origin and path: never query or request payload.
      requests.push({ method, url: url.origin + url.pathname });
    } catch {
      requests.push({ method, url: "invalid-request-url" });
    }
  }
  // Context-level events also observe service-worker-owned HTTP requests;
  // page-only request events can miss them.
  context.on("request", (request) => capture(request.url(), request.method()));
  // Playwright emits WebSockets separately from regular request events.
  page.on("websocket", (socket) => capture(socket.url(), "WEBSOCKET"));
  return requests;
}

function unexpectedRequests(requests: CapturedRequest[], applicationUrl: string) {
  return requests
    .filter(({ url, method }) =>
      isUnexpectedReviewRequest(url, applicationUrl, method),
    )
    .map(({ method, url }) => `${method} ${url}`);
}

test.describe("React homepage review — browser network privacy", () => {
  for (const path of previewPaths) {
    test(`${path} loads no analytics or external resources, even with third-party override`, async ({ context, page }) => {
      const requests = captureRequests(context, page);
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

  test("switching preview locale through Next navigation does not initialize tracking", async ({ context, page }) => {
    const requests = captureRequests(context, page);
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
